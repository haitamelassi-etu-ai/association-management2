require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const User = require('../models/User');

const ADMIN = {
  nom:      'Admin',
  prenom:   'Al Amal',
  email:    'admin@alawal.ma',
  password: 'AlAmal2024',
  role:     'admin',
  poste:    'Administrateur',
};

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ MongoDB connecté');

  const exists = await User.findOne({ email: ADMIN.email });
  if (exists) {
    console.log('⚠️  Admin existe déjà :', ADMIN.email);
    process.exit(0);
  }

  await User.create(ADMIN);
  console.log('✅ Compte admin créé !');
  console.log('   Email    :', ADMIN.email);
  console.log('   Mot de passe :', ADMIN.password);
  process.exit(0);
}

run().catch(err => { console.error('❌', err.message); process.exit(1); });
