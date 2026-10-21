// Entrada del Worker: lee la configuración publicada y arranca el servidor (worker/app.ts).
import { parse } from 'yaml';
import configYaml from '../src/data/reservaciones.yaml';
import negocioYaml from '../src/data/negocio.yaml';
import { validarConfig } from '../src/lib/reservas.ts';
import { app, configurar } from './app.ts';

configurar(validarConfig(parse(configYaml)), (parse(negocioYaml) as { telefono: { visible: string } }).telefono.visible);

export default app;
