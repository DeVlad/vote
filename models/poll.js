var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var AutoIncrement = require('mongoose-sequence')(mongoose);

// Mongoose promises are depricated use global
mongoose.Promise = global.Promise;

var PollSchema = new Schema({
    owner_id: Number,  
    question: String,
    options: [],
    voter_id: [Number]
}, {
    //timestamps: true,
    versionKey: false
});

PollSchema.plugin(AutoIncrement, {
    inc_field: 'pid'
});

module.exports = mongoose.model('Poll', PollSchema);
