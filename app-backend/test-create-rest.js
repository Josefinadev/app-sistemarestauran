const fetch = require('node-fetch');

async function test() {
  const res = await fetch('http://localhost:3001/api/restaurante', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      nombre: 'Test Restaurant',
      slug: 'test-rest-' + Date.now(),
      propietario_nombre: 'Owner Test',
      propietario_email: 'testowner' + Date.now() + '@test.com',
      propietario_password: 'password123'
    })
  });
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}
test();
