const authService = require("../services/auth.service");

async function registrarUsuario(req, res) {
  try {
    const usuario = await authService.registrarUsuario(req.body);
    res.status(201).json({
      mensaje: "Usuario registrado correctamente",
      usuario
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

async function login(req, res) {
  try {
    const { correo, email, password } = req.body;
    const identifier = correo || email;

    const result = await authService.loginUsuario(identifier, password);

    res.json(result);
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
}

module.exports = {
  registrarUsuario,
  login
};
