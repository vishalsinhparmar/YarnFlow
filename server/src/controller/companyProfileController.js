import CompanyProfile from '../models/CompanyProfile.js';

// ============ COMPANY PROFILE CONTROLLERS ============

/**
 * GET /api/company-profile
 * Returns the active company profile (creates default if none exists)
 */
export const getCompanyProfile = async (req, res) => {
  try {
    let profile = await CompanyProfile.findOne({ isActive: true });

    // Auto-seed default profile for first-time setup
    if (!profile) {
      profile = await CompanyProfile.create({
        slug: 'default',
        companyName: 'Your Company Name',
        headOfficeAddress: '',
        branchOfficeAddress: '',
        city: '',
        state: '',
        phone: '',
        gstin: '',
        msmeNo: '',
        isActive: true
      });
    }

    res.status(200).json({ success: true, data: profile });
  } catch (error) {
    console.error('Error fetching company profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch company profile',
      error: error.message
    });
  }
};

/**
 * PUT /api/company-profile
 * Upserts the active company profile
 */
export const updateCompanyProfile = async (req, res) => {
  try {
    const {
      companyName,
      tagline,
      headOfficeAddress,
      branchOfficeAddress,
      city,
      state,
      pincode,
      phone,
      altPhone,
      email,
      website,
      gstin,
      msmeNo,
      panNo,
      udyamNo,
      challanTermsAndConditions,
      challanFooterNote,
      signatureLabel,
      logoUrl,
      primaryColor
    } = req.body;

    if (!companyName || !companyName.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Company name is required'
      });
    }

    const updateData = {
      ...(companyName !== undefined && { companyName: companyName.trim() }),
      ...(tagline !== undefined && { tagline }),
      ...(headOfficeAddress !== undefined && { headOfficeAddress }),
      ...(branchOfficeAddress !== undefined && { branchOfficeAddress }),
      ...(city !== undefined && { city }),
      ...(state !== undefined && { state }),
      ...(pincode !== undefined && { pincode }),
      ...(phone !== undefined && { phone }),
      ...(altPhone !== undefined && { altPhone }),
      ...(email !== undefined && { email }),
      ...(website !== undefined && { website }),
      ...(gstin !== undefined && { gstin }),
      ...(msmeNo !== undefined && { msmeNo }),
      ...(panNo !== undefined && { panNo }),
      ...(udyamNo !== undefined && { udyamNo }),
      ...(Array.isArray(challanTermsAndConditions) && { challanTermsAndConditions }),
      ...(challanFooterNote !== undefined && { challanFooterNote }),
      ...(signatureLabel !== undefined && { signatureLabel }),
      ...(logoUrl !== undefined && { logoUrl }),
      ...(primaryColor !== undefined && { primaryColor }),
      isActive: true
    };

    const profile = await CompanyProfile.findOneAndUpdate(
      { isActive: true },
      { $set: updateData },
      { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true }
    );

    // If upserted with no slug, set it
    if (!profile.slug) {
      profile.slug = 'default';
      await profile.save();
    }

    res.status(200).json({
      success: true,
      message: 'Company profile updated successfully',
      data: profile
    });
  } catch (error) {
    console.error('Error updating company profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update company profile',
      error: error.message
    });
  }
};
