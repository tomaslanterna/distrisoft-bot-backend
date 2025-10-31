const { buildBooking } = require("../builders/booking.builder");
const bookingService = require("../services/booking.service");
const { getDistributorByChannelId } = require("../services/distributorService");

const createBookingController = async (req, res) => {
  try {
    const {
      distributorChannelId,
      clientName,
      clientPhone,
      date,
      time,
      entityId,
      description,
      status,
    } = req.body;

    if (
      !distributorChannelId ||
      !clientName ||
      !clientPhone ||
      !date ||
      !time ||
      !entityId
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Error in createBooking one of this are needed distributorChannelId,clientName,clientPhone,date,time,entityId",
      });
    }

    const distributor = await getDistributorByChannelId(distributorChannelId);

    if (!distributor) {
      return res.status(400).json({
        success: false,
        message: "Error in getDistributorByChannelId",
      });
    }

    const bookingToCreate = buildBooking({
      distributor,
      clientName,
      clientPhone,
      date,
      time,
      entityId,
      description,
      status,
    });

    const createdBooking = await bookingService.createBooking(bookingToCreate);

    if (!createdBooking) {
      return res.status(500).json({
        success: false,
        message: "Error in createBooking",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Booking created succeffuly",
      data: createdBooking,
    });
  } catch (error) {
    console.error("Error en createBookingController:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getBookingsByDistributorController = async (req, res) => {
  try {
    const { distributorChannelId, entityId, rangeDate } = req.params;
    const dates = rangeDate.split("-");
    const startDate = new Date(dates[0]);
    const endDate = new Date(dates[1]);

    if (!distributorChannelId || !entityId || !rangeDate) {
      return res.status(400).json({
        success: false,
        message: "Error in getDistributorByChannelId",
      });
    }

    const distributor = await getDistributorByChannelId(distributorChannelId);

    if (!distributor) {
      return res.status(400).json({
        success: false,
        message: "Error in getDistributorByChannelId",
      });
    }

    if (!entityId) {
      res.status(400).json({
        success: false,
        message: "Error entityId is needed",
      });
    }

    const bookings = await bookingService.getBookingsByDistributor(
      distributor._id,
      entityId
    );

    const bookingsForRangeDate = bookings.filter((book) => {
      const itemDate = new Date(book.date);
      return itemDate >= startDate && itemDate <= endDate;
    });

    return res.status(200).json({
      success: true,
      data: bookingsForRangeDate,
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

    return res.status(200).json({
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
