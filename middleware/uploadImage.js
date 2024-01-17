const fs = require("fs");

module.exports = async function (req, res, next) {
  try {
    if (!req.files || Object.keys(req.files).length == 0)
      return res.status(400).json({ error: "No files recieved" });

    const file = req.files.file;

    // if (file.size > 1024 * 1024) {
    //     removeTmp(file.tempFilePath)
    //     return res.status(400).json({ error: "Size is too large, 1 MB allowed" });
    // }

    // if (!file.mimetype.startsWith("image/")) {
    //   removeTmp(file.tempFilePath);
    //   return res.status(400).json({ error: "Only images are allowed, Incorrect file format!" });
    // }

    next();
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

const removeTmp = (path) => {
  fs.unlink(path, (err) => {
    if (err) throw err;
  });
};
