-- Asignar permisos de pagos bancarios al rol Administrador
INSERT INTO rol_permisos (rol_id, permiso_id) 
SELECT 1, id FROM permisos 
WHERE nombre IN (
  'pago_bancario_post',
  'pago_bancario_put', 
  'pago_bancario_delete',
  'pago_bancario_delete_permanente'
)
ON CONFLICT DO NOTHING;

-- Asignar permisos de cuentas bancarias al rol Administrador
INSERT INTO rol_permisos (rol_id, permiso_id)
SELECT 1, id FROM permisos
WHERE nombre IN (
  'cuenta_bancaria_post',
  'cuenta_bancaria_put',
  'cuenta_bancaria_delete'
)
ON CONFLICT DO NOTHING;

SELECT 'Permisos asignados correctamente' as resultado;
