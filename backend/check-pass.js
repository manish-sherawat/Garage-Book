const bcrypt = require('bcrypt');
const hash = '$2b$10$/Adoi/4D.IW8uEDPtWlaA.of7uapturZ5M8rHK6Xa7elbTwdYFkt.';
async function check() {
  const common = ['admin', 'admin123', 'password', '123456'];
  for (let c of common) {
    if (await bcrypt.compare(c, hash)) {
      console.log('Password is:', c);
      return;
    }
  }
  console.log('Not found');
}
check();
