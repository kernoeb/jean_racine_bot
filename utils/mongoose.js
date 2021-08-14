const mongoose = require('mongoose')
const logger = require('../utils/signale')

mongoose.connect(`mongodb://${process.env.MONGODB_URL}/rootmebot`, {
	useNewUrlParser: true,
	useUnifiedTopology: true,
	useFindAndModify: false,
	useCreateIndex: true
}).then(() => {
	logger.log('Mongoose connected')
})
module.exports = exports = mongoose
