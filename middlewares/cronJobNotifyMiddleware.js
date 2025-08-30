const cronJobNotifyMiddleware = async (req, res, next) => {
  const signature = req.headers["x-cron-job-bot-process"];
  const { CRON_JOB_SECRET } = process.env;

  const isValid = signature === CRON_JOB_SECRET;

  if (!isValid) {
    return res.status(403).send("Firma inválida.");
  }

  next();
};

module.exports = cronJobNotifyMiddleware;
