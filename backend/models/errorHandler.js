// Task Owner: Team FULLSTOK - Initial Setup & General Config
const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  // Default error response
  let error = { ...err };
  error.message = err.message;

  // MySQL error handling
  if (err.code === 'ER_DUP_ENTRY') {
    const message = 'Duplicate field value entered';
    error = { message, statusCode: 400 };
  }

  if (err.code === 'ER_NO_SUCH_TABLE') {
    const message = 'Database table not found';
    error = { message, statusCode: 500 };
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Server Error',
    error: process.env.NODE_ENV === 'development' ? err.stack : {}
  });
};

module.exports = errorHandler;
