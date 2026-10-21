// Pruebas de las reglas de reservación (src/lib/reservas.ts). Sin dependencias: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parse } from 'yaml';
import {
  validarConfig,
  estadoReservas,
  calcularPrecios,
  horariosDelDia,
  horariosReservables,
  ocupacion,
  validarSolicitud,
  horaLegible,
  dinero,
  type ConfigReservas,
} from '../src/lib/reservas.ts';
import { instanteLocal } from '../src/lib/hora.ts';

const base = (): ConfigReservas =>
  validarConfig({
    activas: true,
    moneda: 'usd',
    tarifa: { tipo: 'por_persona', monto: 10 },
    deposito_porcentaje: 50,
    horario: {
      lunes: [],
      martes: [],
      miercoles: [],
      jueves: [],
      viernes: [{ desde: '17:00', hasta: '18:00' }],
      sabado: [
        { desde: '12:00', hasta: '13:00' },
        { desde: '17:00', hasta: '17:30' },
      ],
      domingo: [],
    },
    intervalo_minutos: 30,
    duracion_minutos: 90,
    cupo_personas: 20,
    personas_min: 1,
    personas_max: 12,
    anticipacion_minima_minutos: 120,
    dias_adelante: 30,
    cerrado: ['2026-11-07'],
    minutos_para_pagar: 30,
  });

// Viernes 30 de octubre de 2026, 10:00 hora de Texas.
const AHORA = instanteLocal('2026-10-30T10:00', 'America/Chicago').getTime();

test('el archivo real reservaciones.yaml es válido y queda apagado hasta que el dueño ponga precio y horario', () => {
  const cfg = validarConfig(parse(readFileSync(new URL('../src/data/reservaciones.yaml', import.meta.url), 'utf8')));
  const estado = estadoReservas(cfg);
  assert.equal(estado.listas, false);
  assert.equal(cfg.deposito_porcentaje, 50);
});

test('la configuración inválida explica qué corregir', () => {
  assert.throws(() => validarConfig({ ...base(), deposito_porcentaje: 0 }), /deposito_porcentaje/);
  assert.throws(() => validarConfig({ ...base(), tarifa: { tipo: 'por_persona', monto: -5 } }), /tarifa.monto/);
  assert.throws(() => validarConfig({ ...base(), horario: { ...base().horario, lunes: [{ desde: '9pm', hasta: '10pm' }] } }), /horario.lunes/);
  assert.throws(() => validarConfig({ ...base(), minutos_para_pagar: 10 }), /minutos_para_pagar/);
});

test('estado: sin tarifa o sin horario no se reserva en línea', () => {
  assert.deepEqual(estadoReservas(base()), { listas: true });
  assert.deepEqual(estadoReservas({ ...base(), tarifa: { tipo: 'por_persona', monto: null } }), { listas: false, motivo: 'sin_tarifa' });
  assert.deepEqual(estadoReservas({ ...base(), activas: false }), { listas: false, motivo: 'apagadas' });
  const sinHorario = { ...base(), horario: Object.fromEntries(Object.keys(base().horario).map((d) => [d, []])) } as ConfigReservas;
  assert.deepEqual(estadoReservas(sinHorario), { listas: false, motivo: 'sin_horario' });
});

test('depósito del 50 % en centavos exactos', () => {
  assert.deepEqual(calcularPrecios(base(), 4), { total: 4000, deposito: 2000, resto: 2000 });
  // Montos impares: el depósito se redondea al centavo y el resto cuadra con el total.
  const impar = { ...base(), tarifa: { tipo: 'por_reserva' as const, monto: 25.01 } };
  const p = calcularPrecios(impar, 3)!;
  assert.equal(p.total, 2501);
  assert.equal(p.deposito + p.resto, p.total);
  assert.equal(p.deposito, 1251);
  // Con flotantes, 0.1 * 3 daría 0.30000000000000004; en centavos no.
  const decimal = { ...base(), tarifa: { tipo: 'por_persona' as const, monto: 0.1 } };
  assert.deepEqual(calcularPrecios(decimal, 3), { total: 30, deposito: 15, resto: 15 });
  assert.equal(calcularPrecios({ ...base(), tarifa: { tipo: 'por_persona', monto: null } }, 2), null);
});

test('horarios por día, con tramos y fechas cerradas', () => {
  assert.deepEqual(horariosDelDia(base(), '2026-10-30'), ['17:00', '17:30', '18:00']); // viernes
  assert.deepEqual(horariosDelDia(base(), '2026-10-31'), ['12:00', '12:30', '13:00', '17:00', '17:30']); // sábado
  assert.deepEqual(horariosDelDia(base(), '2026-11-02'), []); // lunes
  assert.deepEqual(horariosDelDia(base(), '2026-11-07'), []); // sábado cerrado
  assert.deepEqual(horariosDelDia(base(), 'mañana'), []);
});

test('no se ofrecen fechas pasadas, horas sin anticipación ni fechas fuera de la ventana', () => {
  assert.deepEqual(horariosReservables(base(), '2026-10-29', AHORA), []); // ayer
  // Hoy a las 10:00 con 2 h de anticipación: 17:00 en adelante sí.
  assert.deepEqual(horariosReservables(base(), '2026-10-30', AHORA), ['17:00', '17:30', '18:00']);
  const tarde = instanteLocal('2026-10-30T15:45', 'America/Chicago').getTime();
  assert.deepEqual(horariosReservables(base(), '2026-10-30', tarde), ['18:00']);
  assert.deepEqual(horariosReservables(base(), '2026-12-25', AHORA), []); // más de 30 días
});

test('cupo: se suman las reservas que se traslapan', () => {
  const ocupadas = [
    { inicio: 17 * 60, fin: 18 * 60 + 30, personas: 8 },
    { inicio: 19 * 60, fin: 20 * 60 + 30, personas: 6 },
  ];
  assert.equal(ocupacion(ocupadas, 17 * 60 + 30, 19 * 60), 8);
  assert.equal(ocupacion(ocupadas, 18 * 60, 19 * 60 + 30), 14);
  assert.equal(ocupacion(ocupadas, 18 * 60 + 30, 19 * 60), 0); // termina justo cuando empieza: no se cruzan
});

test('validación de la solicitud', () => {
  const buena = { nombre: '  Ana   García ', telefono: '(210) 555-0134', email: 'Ana@Example.com', fecha: '2026-10-31', hora: '12:30', personas: '4', peticiones: 'Birthday!' };
  const r = validarSolicitud(base(), buena, AHORA);
  assert.ok(r.ok);
  if (r.ok) {
    assert.equal(r.valor.nombre, 'Ana García');
    assert.equal(r.valor.email, 'ana@example.com');
    assert.equal(r.valor.personas, 4);
  }
  const mala = validarSolicitud(base(), { nombre: 'A', telefono: '123', email: 'nope', fecha: '2026-10-29', hora: '12:30', personas: 40 }, AHORA);
  assert.ok(!mala.ok);
  if (!mala.ok) assert.deepEqual(Object.keys(mala.errores).sort(), ['email', 'fecha', 'nombre', 'personas', 'telefono']);
  const horaMala = validarSolicitud(base(), { ...buena, hora: '12:15' }, AHORA);
  assert.ok(!horaMala.ok && 'hora' in horaMala.errores);
  const larga = validarSolicitud(base(), { ...buena, peticiones: 'x'.repeat(501) }, AHORA);
  assert.ok(!larga.ok && 'peticiones' in larga.errores);
});

test('formatos legibles', () => {
  assert.equal(horaLegible('00:30'), '12:30 AM');
  assert.equal(horaLegible('12:00'), '12:00 PM');
  assert.equal(horaLegible('19:30'), '7:30 PM');
  assert.equal(dinero(2050), '$20.50');
});
