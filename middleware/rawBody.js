//  Adapted from here: https://medium.com/@sukhadagholb/webhook-signature-verification-for-stripe-are-you-passing-raw-request-body-received-from-stripe-3b2deed6a75d


module.exports = async function(req, res, next) {
  var data_stream ='';                 
 
  // Readable streams emit 'data' events once a listener is added
  req.setEncoding('utf-8')            
  .on('data', function(data) {                         
    data_stream += data;      
  })    
  .on('end', function() {           
    req.rawBody                                                 
    req.rawBody = data_stream;   
    next();
  }) 
}