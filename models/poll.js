var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// Mongoose promises are depricated use global
mongoose.Promise = global.Promise;

var PollSchema = new Schema({
    owner: {
        type: Schema.ObjectId,
        ref: 'UserSchema'
    },
    poll: {
        type: String,
        question: String,
        options: [{ String: Number }, { String: Number }]
    },
    voter_id: [Number]

}, {
    timestamps: true,
    versionKey: false
});

module.exports = mongoose.model('Poll', PollSchema);
