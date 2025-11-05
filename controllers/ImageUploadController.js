const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');

// Configure multer for file upload
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  // Check file type
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: fileFilter
});

// Ensure upload directories exist
const ensureUploadDirs = async () => {
  const dirs = [
    'uploads',
    'uploads/images',
    'uploads/images/avatars',
    'uploads/images/posts',
    'uploads/images/reviews',
    'uploads/images/places',
    'uploads/images/articles',
    'uploads/images/thumbnails'
  ];

  for (const dir of dirs) {
    try {
      await fs.access(dir);
    } catch {
      await fs.mkdir(dir, { recursive: true });
    }
  }
};

// Initialize upload directories
ensureUploadDirs();

/**
 * Upload single image
 * @route POST /api/v1/upload/image
 * @access Private
 */
const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }

    const { type = 'general', quality = 80 } = req.body;
    const allowedTypes = ['avatar', 'post', 'review', 'place', 'article', 'general'];
    
    if (!allowedTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid image type. Allowed types: ' + allowedTypes.join(', ')
      });
    }

    // Generate unique filename
    const fileExtension = '.webp'; // Convert all images to WebP for optimization
    const fileName = `${uuidv4()}${fileExtension}`;
    const uploadPath = `uploads/images/${type}s`;
    const filePath = path.join(uploadPath, fileName);

    // Process image with Sharp
    let sharpInstance = sharp(req.file.buffer);
    
    // Get image metadata
    const metadata = await sharpInstance.metadata();
    
    // Resize based on type
    switch (type) {
      case 'avatar':
        sharpInstance = sharpInstance.resize(300, 300, {
          fit: 'cover',
          position: 'center'
        });
        break;
      case 'post':
      case 'review':
        // Limit max width to 1200px while maintaining aspect ratio
        if (metadata.width > 1200) {
          sharpInstance = sharpInstance.resize(1200, null, {
            fit: 'inside',
            withoutEnlargement: true
          });
        }
        break;
      case 'place':
      case 'article':
        // Limit max width to 800px while maintaining aspect ratio
        if (metadata.width > 800) {
          sharpInstance = sharpInstance.resize(800, null, {
            fit: 'inside',
            withoutEnlargement: true
          });
        }
        break;
    }

    // Convert to WebP and save
    await sharpInstance
      .webp({ quality: parseInt(quality) })
      .toFile(filePath);

    // Generate thumbnail for non-avatar images
    let thumbnailPath = null;
    if (type !== 'avatar') {
      const thumbnailFileName = `thumb_${fileName}`;
      thumbnailPath = path.join('uploads/images/thumbnails', thumbnailFileName);
      
      await sharp(req.file.buffer)
        .resize(300, 300, {
          fit: 'cover',
          position: 'center'
        })
        .webp({ quality: 70 })
        .toFile(thumbnailPath);
    }

    // Get file stats
    const stats = await fs.stat(filePath);

    const imageData = {
      id: uuidv4(),
      original_name: req.file.originalname,
      filename: fileName,
      path: filePath,
      url: `/uploads/images/${type}s/${fileName}`,
      thumbnail_url: thumbnailPath ? `/uploads/images/thumbnails/thumb_${fileName}` : null,
      type: type,
      size: stats.size,
      mimetype: 'image/webp',
      uploaded_at: new Date(),
      uploaded_by: req.user?.id || null
    };

    res.status(200).json({
      success: true,
      message: 'Image uploaded successfully',
      data: imageData
    });

  } catch (error) {
    console.error('Error in uploadImage:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload image',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Upload multiple images
 * @route POST /api/v1/upload/images
 * @access Private
 */
const uploadMultipleImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No image files provided'
      });
    }

    const { type = 'general', quality = 80 } = req.body;
    const allowedTypes = ['avatar', 'post', 'review', 'place', 'article', 'general'];
    
    if (!allowedTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid image type. Allowed types: ' + allowedTypes.join(', ')
      });
    }

    const maxFiles = 10;
    if (req.files.length > maxFiles) {
      return res.status(400).json({
        success: false,
        message: `Maximum ${maxFiles} files allowed`
      });
    }

    const uploadedImages = [];
    const uploadPath = `uploads/images/${type}s`;

    for (const file of req.files) {
      try {
        // Generate unique filename
        const fileExtension = '.webp';
        const fileName = `${uuidv4()}${fileExtension}`;
        const filePath = path.join(uploadPath, fileName);

        // Process image with Sharp
        let sharpInstance = sharp(file.buffer);
        
        // Get image metadata
        const metadata = await sharpInstance.metadata();
        
        // Resize based on type (same logic as single upload)
        switch (type) {
          case 'avatar':
            sharpInstance = sharpInstance.resize(300, 300, {
              fit: 'cover',
              position: 'center'
            });
            break;
          case 'post':
          case 'review':
            if (metadata.width > 1200) {
              sharpInstance = sharpInstance.resize(1200, null, {
                fit: 'inside',
                withoutEnlargement: true
              });
            }
            break;
          case 'place':
          case 'article':
            if (metadata.width > 800) {
              sharpInstance = sharpInstance.resize(800, null, {
                fit: 'inside',
                withoutEnlargement: true
              });
            }
            break;
        }

        // Convert to WebP and save
        await sharpInstance
          .webp({ quality: parseInt(quality) })
          .toFile(filePath);

        // Generate thumbnail
        let thumbnailPath = null;
        if (type !== 'avatar') {
          const thumbnailFileName = `thumb_${fileName}`;
          thumbnailPath = path.join('uploads/images/thumbnails', thumbnailFileName);
          
          await sharp(file.buffer)
            .resize(300, 300, {
              fit: 'cover',
              position: 'center'
            })
            .webp({ quality: 70 })
            .toFile(thumbnailPath);
        }

        // Get file stats
        const stats = await fs.stat(filePath);

        const imageData = {
          id: uuidv4(),
          original_name: file.originalname,
          filename: fileName,
          path: filePath,
          url: `/uploads/images/${type}s/${fileName}`,
          thumbnail_url: thumbnailPath ? `/uploads/images/thumbnails/thumb_${fileName}` : null,
          type: type,
          size: stats.size,
          mimetype: 'image/webp',
          uploaded_at: new Date(),
          uploaded_by: req.user?.id || null
        };

        uploadedImages.push(imageData);

      } catch (fileError) {
        console.error(`Error processing file ${file.originalname}:`, fileError);
        // Continue with other files, but log the error
      }
    }

    if (uploadedImages.length === 0) {
      return res.status(500).json({
        success: false,
        message: 'Failed to upload any images'
      });
    }

    res.status(200).json({
      success: true,
      message: `Successfully uploaded ${uploadedImages.length} of ${req.files.length} images`,
      data: {
        images: uploadedImages,
        total_uploaded: uploadedImages.length,
        total_attempted: req.files.length
      }
    });

  } catch (error) {
    console.error('Error in uploadMultipleImages:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload images',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Delete image
 * @route DELETE /api/v1/upload/image/:filename
 * @access Private
 */
const deleteImage = async (req, res) => {
  try {
    const { filename } = req.params;
    const { type = 'general' } = req.query;

    if (!filename) {
      return res.status(400).json({
        success: false,
        message: 'Filename is required'
      });
    }

    // Construct file paths
    const imagePath = path.join(`uploads/images/${type}s`, filename);
    const thumbnailPath = path.join('uploads/images/thumbnails', `thumb_${filename}`);

    try {
      // Delete main image
      await fs.unlink(imagePath);
      
      // Try to delete thumbnail (if exists)
      try {
        await fs.unlink(thumbnailPath);
      } catch (thumbError) {
        // Thumbnail might not exist, that's okay
      }

      res.status(200).json({
        success: true,
        message: 'Image deleted successfully'
      });

    } catch (deleteError) {
      if (deleteError.code === 'ENOENT') {
        return res.status(404).json({
          success: false,
          message: 'Image not found'
        });
      }
      throw deleteError;
    }

  } catch (error) {
    console.error('Error in deleteImage:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete image',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get image info
 * @route GET /api/v1/upload/image/:filename/info
 * @access Public
 */
const getImageInfo = async (req, res) => {
  try {
    const { filename } = req.params;
    const { type = 'general' } = req.query;

    if (!filename) {
      return res.status(400).json({
        success: false,
        message: 'Filename is required'
      });
    }

    const imagePath = path.join(`uploads/images/${type}s`, filename);

    try {
      const stats = await fs.stat(imagePath);
      const metadata = await sharp(imagePath).metadata();

      const imageInfo = {
        filename: filename,
        path: imagePath,
        url: `/uploads/images/${type}s/${filename}`,
        size: stats.size,
        width: metadata.width,
        height: metadata.height,
        format: metadata.format,
        created_at: stats.birthtime,
        modified_at: stats.mtime
      };

      res.status(200).json({
        success: true,
        message: 'Image info retrieved successfully',
        data: imageInfo
      });

    } catch (fileError) {
      if (fileError.code === 'ENOENT') {
        return res.status(404).json({
          success: false,
          message: 'Image not found'
        });
      }
      throw fileError;
    }

  } catch (error) {
    console.error('Error in getImageInfo:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get image info',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  upload,
  uploadImage,
  uploadMultipleImages,
  deleteImage,
  getImageInfo
};