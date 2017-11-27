var mongoose = require('mongoose');
var Schema = mongoose.Schema;

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

module.exports = mongoose.model('Poll', PollSchema);
