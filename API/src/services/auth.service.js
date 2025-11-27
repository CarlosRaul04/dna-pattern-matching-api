const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

async function registrarUsuario(data) {
  const { nombre, apellido, dni, numero, email, password } = data;

  const existeUsuario = await User.findOne({ email });
  if (existeUsuario) {
    throw new Error("El usuario ya existe");
  }

  // Hashear la contraseña
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  const nuevoUsuario = await User.create({
    nombre,
    apellido,
    dni,
    numero,
    email,
    password: passwordHash
  });

  return nuevoUsuario;
}

async function loginUsuario(identifier, password) {
  const usuario = await User.findOne({
    $or: [
      { email: identifier },
      { correo: identifier }
    ]
  });

  if (!usuario) {
    throw new Error("Credenciales inválidas");
  }

  const validPassword = await bcrypt.compare(password, usuario.password);
  if (!validPassword) {
    throw new Error("Credenciales inválidas");
  }

  const token = jwt.sign(
    { id: usuario._id, correo: usuario.email || usuario.correo },
    process.env.JWT_SECRET,
    { expiresIn: "6h" }
  );

  return {
    token,
    usuario: {
      id: usuario._id,
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      correo: usuario.email || usuario.correo
    }
  };
}

module.exports = {
  registrarUsuario,
  loginUsuario
};
