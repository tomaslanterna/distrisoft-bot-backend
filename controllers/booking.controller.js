const bookingService = require("../services/booking.service");

const createBookingController = async (req, res) => {
  try {
    const { booking } = req.body;

    const createdBooking = await bookingService.createBooking(booking);
    res.status(201).json({
      success: true,
      message: "Reserva creada exitosamente",
      data: createdBooking,
    });
  } catch (error) {
    console.error("Error en createBookingController:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getBookingsByDistributorController = async (req, res) => {
  try {
    const { distributorId } = req.params;
    const bookings = await bookingService.getBookingsByDistributor(
      distributorId
    );

    res.status(200).json({
      success: true,
      data: bookings,
    });
  } catch (error) {
    console.error("Error en getBookingsByDistributorController:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateBookingController = async (req, res) => {
  try {
    const { bookingId } = req.body;
    const updatedBooking = await bookingService.updateBooking(
      bookingId,
      req.body
    );

    if (!updatedBooking) {
      return res.status(404).json({
        success: false,
        message: "Reserva no encontrada",
      });
    }

    res.status(200).json({
      success: true,
      message: "Reserva actualizada correctamente",
      data: updatedBooking,
    });
  } catch (error) {
    console.error("Error en updateBookingController:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createBookingController,
  getBookingsByDistributorController,
  updateBookingController,
};
