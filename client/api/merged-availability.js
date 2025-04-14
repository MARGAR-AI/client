const availabilityHandler = require('./availability');

module.exports = (req, res) => {
  // Call the availability handler to get the data
  availabilityHandler(req, res);
}; 