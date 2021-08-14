const mongoose = require('mongoose')
const logger = require('../utils/signale')

mongoose.connect('mongodb://localhost:27017/rootmebot', {
	useNewUrlParser: true,
	useUnifiedTopology: true,
	useFindAndModify: false,
	useCreateIndex: true
}).then(() => {
	logger.log('Mongoose connected')
})
module.exports = exports = mongoose
