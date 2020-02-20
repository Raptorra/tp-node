var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var ConferenceSchema = new Schema({
    name: String,
    message: [{
        user: String,
        content: String
    }]
});

Conference = mongoose.model('Conference', ConferenceSchema);

module.exports = Conference;