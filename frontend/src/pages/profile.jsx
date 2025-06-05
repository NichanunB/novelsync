// frontend/src/pages/profile.jsx
import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { authAPI } from "../services/api";
import {Pencil, User2, } from "lucide-react"
import "../components/styles/profile.css";

function Profile() {
  const { user, isLoggedIn } = useAuth();
  const [username, setUsername] = useState("");
  const [profileImage, setProfileImage] = useState("");
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState(""); // "success" or "error"
  const fileInputRef = useRef(null);

  // Load user data when component mounts
  useEffect(() => {
    if (user) {
      setUsername(user.user_name || "");
      setProfileImage(user.profile_image || "");
      setTempName(user.user_name || "");
    }
  }, [user]);

  const showMessage = (text, type) => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => {
      setMessage("");
      setMessageType("");
    }, 3000);
  };

  const handleEditNameClick = () => {
    setTempName(username);
    setIsEditingName(true);
  };

  const handleCancelNameEdit = () => {
    setTempName(username);
    setIsEditingName(false);
  };

  const handleSaveName = async () => {
    if (!tempName.trim()) {
      showMessage("Username cannot be empty", "error");
      return;
    }

    setIsLoading(true);
    try {
      const updateData = { user_name: tempName.trim() };
      await authAPI.updateProfile(updateData);
      
      setUsername(tempName.trim());
      setIsEditingName(false);
      showMessage("Username updated successfully!", "success");
    } catch (error) {
      console.error("Error updating username:", error);
      showMessage("Failed to update username. Please try again.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showMessage("Image size must be less than 5MB", "error");
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      showMessage("Please select a valid image file", "error");
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const imageData = e.target.result;
      
      setIsLoading(true);
      try {
        const updateData = { profile_image: imageData };
        await authAPI.updateProfile(updateData);
        
        setProfileImage(imageData);
        showMessage("Profile image updated successfully!", "success");
      } catch (error) {
        console.error("Error updating profile image:", error);
        showMessage("Failed to update profile image. Please try again.", "error");
      } finally {
        setIsLoading(false);
      }
    };
    
    reader.readAsDataURL(file);
  };

  const triggerImageUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleEditProfile = () => {
    // This could open a modal or navigate to a detailed edit page
    alert("Edit profile functionality - could open detailed settings");
  };

  if (!isLoggedIn) {
    return (
      <div className="profile-container">
        <h2>Please log in to view your profile</h2>
      </div>
    );
  }

  return (
    <div className="profile-container">
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        accept="image/*"
        onChange={handleImageUpload}
      />

      {/* Profile Image with Edit Icon */}
      <div className="profile-image-wrapper">
        <div 
          className="profile-image-main" 
          style={{
            backgroundImage: profileImage ? `url(${profileImage})` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundColor: profileImage ? 'transparent' : '#f0f0f0',
          }}
        >
          {!profileImage && (
            <div className="no-image-placeholder">
              <span><User2 size={50} /></span>
            </div>
          )}
        </div>
        
        {/* Edit icon for image */}
        <button 
          className="edit-image-btn" 
          onClick={triggerImageUpload}
          disabled={isLoading}
          title="Change profile picture"
        >
          <Pencil size={20} />
        </button>
      </div>

      {/* Username Section */}
      <div className="username-section">
        {isEditingName ? (
          <div className="edit-username-inline">
            <input
              className="username-input-inline"
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              placeholder="Enter username"
              maxLength={50}
              disabled={isLoading}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveName();
                if (e.key === 'Escape') handleCancelNameEdit();
              }}
            />
            <div className="inline-edit-controls">
              <button 
                className="save-btn-small" 
                onClick={handleSaveName}
                disabled={isLoading || !tempName.trim()}
              >
                ✓
              </button>
              <button 
                className="cancel-btn-small" 
                onClick={handleCancelNameEdit}
                disabled={isLoading}
              >
                ✕
              </button>
            </div>
          </div>
        ) : (
          <h2 className="username-display">{username || 'No Username'}</h2>
        )}
      </div>

      {/* Action Buttons */}
      <div className="action-buttons">
        <button 
          className="action-btn primary-btn" 
          onClick={handleEditNameClick}
          disabled={isLoading || isEditingName}
        >
          Edit name
        </button>
      </div>

      {/* User Info */}
      <div className="user-info">
        <p className="user-email">{user?.email}</p>
      </div>

      {/* Status Messages */}
      {message && (
        <div className={`message ${messageType}`}>
          {message}
        </div>
      )}

      {/* Loading Overlay */}
      {isLoading && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
        </div>
      )}
    </div>
  );
}

export default Profile;
