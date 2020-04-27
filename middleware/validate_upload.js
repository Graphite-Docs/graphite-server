const MAX_FILE_SIZE = 50000000 //  5mb

module.exports = async function(req, res, next) {
  //  Get upload payload
  const { files } = req;

  // if(!files) {
  //   return res.status(401).json({ msg: 'You must provide a file to upload' });
  // }

  //  Check that file being uploaded is a PDF
  try {
    if (!files || Object.keys(files).length === 0) {
      return res.status(400).json({ msg: 'No file provided to upload' });
    }

    //  Get the key for the first item in the files array
    const fileKey = Object.keys(files)[0]
    const file = files[fileKey]
    if(!file.mimetype.includes('image')) {
      return res.status(400).json({ msg: 'Invalid file type, please upload an image' });
    }

    //  Check that the file size is under our limit
    if(file.size > MAX_FILE_SIZE) {
      return res.status(413).json({ msg: 'File too large' });
    }

    next();
  } catch(err) {
    console.log(err);
    res.status(401).json({ msg: 'Invalid file type, please upload an image' });
  }
}