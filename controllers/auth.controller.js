const { registerUser, loginUser } = require("../services/auth.service");

const loginController = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Debe ingresar usuario y contraseña",
      });
    }

    const { token, user } = await loginUser(username, password);

    return res.status(200).json({
      success: true,
      message: "Login exitoso",
      token,
      user: {
        username: user.username,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Error en loginController:", error);
    return res.status(401).json({
      success: false,
      message: error.message || "Credenciales inválidas",
    });
  }
};

const registerController = async (req, res) => {
  try {
    const { username, password, role, distributorChannelId } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Faltan campos obligatorios",
      });
    }

    const user = await registerUser({
      username,
      password,
      role,
      distributorChannelId,
    });

    res.status(201).json({
      success: true,
      message: "Usuario registrado con éxito",
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
        distributorChannelId: user.distributorChannelId,
      },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = { loginController, registerController };
