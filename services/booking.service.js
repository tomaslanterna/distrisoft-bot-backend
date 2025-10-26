const Booking = require("../models/Booking");

/**
 * Crear una nueva booking
 */
const createBooking = async (bookingData) => {
  try {
    const booking = new Booking(bookingData);
    await booking.save();
    return booking;
  } catch (error) {
    console.error("Error en createBooking:", error);
    throw new Error("Error al crear la reserva");
  }
};

/**
 * Obtener todas las bookings por distributorId
 */
const getBookingsByDistributor = async (distributorId) => {
  try {
    return await Booking.find({ distributorId }).sort({ date: -1 });
  } catch (error) {
    console.error("Error en getBookingsByDistributor:", error);
    throw new Error("Error al obtener las reservas");
  }
};

/**
 * Editar una booking
 */
const updateBooking = async (bookingId, updateData) => {
  try {
    const updated = await Booking.findByIdAndUpdate(
      bookingId,
      { $set: updateData },
      { new: true } // devuelve el objeto actualizado
    );
    return updated;
  } catch (error) {
    console.error("Error en updateBooking:", error);
    throw new Error("Error al actualizar la reserva");
  }
};

module.exports = {
  createBooking,
  getBookingsByDistributor,
  updateBooking,
};
