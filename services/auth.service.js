const User = require("../models/User");
const { generateToken } = require("../utils/jwt");

const loginUser = async (username, password) => {
  const user = await User.findOne({ username });
  if (!user) {
    throw new Error("Usuario no encontrado");
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new Error("Contraseña incorrecta");
  }

  const token = generateToken(user);
  return { token, user };
};

const registerUser = async ({
  username,
  password,
  role,
  distributorChannelId,
  distributor,
}) => {
  // Verificar si el usuario ya existe
  const existingUser = await User.findOne({ $or: [{ username }] });
  if (existingUser) {
    throw new Error("El usuario o el email ya están registrados.");
  }

  // Crear el nuevo usuario
  const user = new User({
    username,
    password,
    role,
    distributorChannelId,
    distributor,
  });

  await user.save();
  return user;
};

module.exports = { loginUser, registerUser };
