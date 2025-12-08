import Unit from '../models/Unit.js';

// Get all units
const getAllUnits = async (req, res) => {
  try {
    const units = await Unit.find().sort({ name: 1 });
    
    res.status(200).json({
      success: true,
      data: units,
      count: units.length
    });
  } catch (error) {
    console.error('Error fetching units:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch units',
      error: error.message
    });
  }
};

// Create new unit
const createUnit = async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Unit name is required'
      });
    }
    
    // Check if unit already exists (case-insensitive)
    const existingUnit = await Unit.findOne({ 
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') }
    });
    
    if (existingUnit) {
      return res.status(400).json({
        success: false,
        message: 'Unit with this name already exists'
      });
    }
    
    const unit = new Unit({ name: name.trim() });
    await unit.save();
    
    res.status(201).json({
      success: true,
      message: 'Unit created successfully',
      data: unit
    });
  } catch (error) {
    console.error('Error creating unit:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Unit with this name already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to create unit',
      error: error.message
    });
  }
};

// Update unit
const updateUnit = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Unit name is required'
      });
    }
    
    // Check if another unit with the same name exists (excluding current unit)
    const existingUnit = await Unit.findOne({ 
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
      _id: { $ne: id }
    });
    
    if (existingUnit) {
      return res.status(400).json({
        success: false,
        message: 'Unit with this name already exists'
      });
    }
    
    const unit = await Unit.findByIdAndUpdate(
      id,
      { name: name.trim() },
      { new: true, runValidators: true }
    );
    
    if (!unit) {
      return res.status(404).json({
        success: false,
        message: 'Unit not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Unit updated successfully',
      data: unit
    });
  } catch (error) {
    console.error('Error updating unit:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Unit with this name already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to update unit',
      error: error.message
    });
  }
};

// Delete unit
const deleteUnit = async (req, res) => {
  try {
    const { id } = req.params;
    
    const unit = await Unit.findByIdAndDelete(id);
    
    if (!unit) {
      return res.status(404).json({
        success: false,
        message: 'Unit not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Unit deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting unit:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete unit',
      error: error.message
    });
  }
};

export {
  getAllUnits,
  createUnit,
  updateUnit,
  deleteUnit
};
