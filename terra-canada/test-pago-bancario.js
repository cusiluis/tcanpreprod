// Script de prueba para debuggear el problema de autenticación en pagos bancarios
// Ejecuta esto en la consola del navegador (F12)

console.log('=== INICIANDO PRUEBAS DE PAGO BANCARIO ===\n');

// 1. Verificar localStorage
console.log('1. VERIFICANDO LOCALSTORAGE:');
console.log('   Token en localStorage:', localStorage.getItem('token') ? 'SÍ' : 'NO');
console.log('   User en localStorage:', localStorage.getItem('user') ? 'SÍ' : 'NO');
console.log('   Todas las keys:', Object.keys(localStorage));

const token = localStorage.getItem('token');
if (token) {
  console.log('   Token (primeros 50 caracteres):', token.substring(0, 50) + '...');
}

// 2. Hacer solicitud POST de prueba
console.log('\n2. HACIENDO SOLICITUD POST A /api/v1/pagos-bancarios:');

const testData = {
  clienteId: 1,
  proveedorId: 1,
  correoProveedor: 'test@test.com',
  cuentaBancariaId: 1,
  monto: 100,
  numeroPresta: 'TEST-001',
  comentarios: 'Prueba desde consola'
};

console.log('   Datos a enviar:', testData);
console.log('   Token en header:', token ? 'SÍ' : 'NO');

fetch('http://localhost:3000/api/v1/pagos-bancarios', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(testData)
})
.then(res => {
  console.log('\n3. RESPUESTA DEL SERVIDOR:');
  console.log('   Status:', res.status, res.statusText);
  console.log('   Headers:', {
    'content-type': res.headers.get('content-type'),
    'authorization': res.headers.get('authorization')
  });
  return res.json().then(data => ({ status: res.status, data }));
})
.then(({ status, data }) => {
  console.log('   Body:', data);
  if (status === 201) {
    console.log('\n✅ ÉXITO: Pago bancario creado correctamente');
  } else if (status === 401) {
    console.log('\n❌ ERROR 401: Usuario no autenticado');
    console.log('   Detalles:', data);
  } else if (status === 403) {
    console.log('\n❌ ERROR 403: No tienes permisos (no eres admin)');
    console.log('   Detalles:', data);
  } else {
    console.log('\n❌ ERROR:', status, data);
  }
})
.catch(err => {
  console.error('\n❌ ERROR EN LA SOLICITUD:', err);
});

console.log('\n=== PRUEBAS INICIADAS ===');
console.log('Espera a que se complete la solicitud...\n');
