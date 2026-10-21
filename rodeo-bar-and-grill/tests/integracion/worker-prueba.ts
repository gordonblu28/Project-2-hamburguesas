// Entrada del Worker para las pruebas: la misma app, con la configuración de prueba.
import { parse } from 'yaml';
import configYaml from './reservaciones.prueba.yaml';
import { validarConfig } from '../../src/lib/reservas.ts';
import { app, configurar } from '../../worker/app.ts';

configurar(validarConfig(parse(configYaml)), '(210) 969-6002');

export default app;
