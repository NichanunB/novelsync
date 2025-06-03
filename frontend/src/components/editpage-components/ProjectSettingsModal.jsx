// frontend/src/components/editpage-components/ProjectSettingsModal.jsx
import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import CoverImageUpload from './CoverImageUpload';
import './coverimage.css';

function ProjectSettingsModal({ 
  isOpen, 
  onClose, 
  project, 
  onSave,
  isLoading 
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [coverImage, setCoverImage] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize state when project loads
  useEffect(() => {
    if (project) {
      setTitle(project.title || 'Untitled Character Diagram');
      setDescription(project.description || '');
      setCoverImage(project.cover_image || null);
      setHasChanges(false);
    }
  }, [project]);

  // Check for changes - ✅ แก้ไขการตัดสินใจว่ามีการเปลี่ยนแปลงหรือไม่
  useEffect(() => {
    if (project) {
      const originalTitle = project.title || 'Untitled Character Diagram';
      const originalDescription = project.description || '';
      const originalCoverImage = project.cover_image || null;
      
      const titleChanged = title !== originalTitle;
      const descriptionChanged = description !== originalDescription;
      const coverImageChanged = coverImage !== originalCoverImage;
      
      const changed = titleChanged || descriptionChanged || coverImageChanged;
      
      console.log('Checking changes:', {
        titleChanged,
        descriptionChanged,
        coverImageChanged,
        changed,
        currentCover: coverImage,
        originalCover: originalCoverImage
      });
      
      setHasChanges(changed);
    }
  }, [title, description, coverImage, project]);

  const handleSave = async () => {
    const updates = {
      title: title.trim() || 'Untitled Character Diagram',
      description: description.trim() || null,
      cover_image: coverImage
    };
    
    console.log('Saving updates:', updates);
    
    await onSave(updates);
    onClose();
  };

  const handleCancel = () => {
    // Reset to original values
    if (project) {
      setTitle(project.title || 'Untitled Character Diagram');
      setDescription(project.description || '');
      setCoverImage(project.cover_image || null);
    }
    onClose();
  };

  // ✅ เพิ่มฟังก์ชันสำหรับจัดการการเปลี่ยนแปลงรูปภาพ
  const handleImageChange = (newImage) => {
    console.log('Image changed:', newImage);
    setCoverImage(newImage);
  };

  if (!isOpen) return null;

  return (
    <div className="project-settings-modal" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Project Settings</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="modal-body">
          {/* Cover Image Section */}
          <div className="settings-section">
            <h3 className="section-title">Cover Image</h3>
            <CoverImageUpload
              coverImage={coverImage}
              onImageChange={handleImageChange}
              isLoading={isLoading}
            />
          </div>

          {/* Project Details Section */}
          <div className="settings-section">
            <h3 className="section-title">Project Details</h3>
            
            <div className="form-group">
              <label htmlFor="project-title">Project Title</label>
              <input
                id="project-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter project title"
                maxLength={255}
                disabled={isLoading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="project-description">Description (Optional)</label>
              <textarea
                id="project-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your character diagram..."
                rows={4}
                disabled={isLoading}
              />
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button 
            className="modal-btn cancel-btn" 
            onClick={handleCancel}
            disabled={isLoading}
          >
            Cancel
          </button>
          <button 
            className="modal-btn save-btn" 
            onClick={handleSave}
            disabled={isLoading || !hasChanges}
          >
            {isLoading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        {/* ✅ Debug info - ลบออกได้เมื่อแก้ไขเสร็จ */}
        {process.env.NODE_ENV === 'development' && (
          <div style={{ 
            position: 'absolute', 
            bottom: '-100px', 
            left: '0', 
            background: '#000', 
            color: '#fff', 
            padding: '10px', 
            fontSize: '12px',
            borderRadius: '4px',
            width: '100%'
          }}>
            <div>Has Changes: {hasChanges ? 'YES' : 'NO'}</div>
            <div>Title: {title}</div>
            <div>Original Title: {project?.title}</div>
            <div>Cover Image: {coverImage ? 'YES' : 'NO'}</div>
            <div>Original Cover: {project?.cover_image ? 'YES' : 'NO'}</div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProjectSettingsModal;
