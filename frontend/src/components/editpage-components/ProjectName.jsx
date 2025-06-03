// frontend/src/components/editpage-components/ProjectName.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Edit2, Check } from 'lucide-react';
import '../styles/projectname.css';

/**
 * ProjectName component - Allows users to view and edit the project name
 * @param {Object} props
 * @param {string} props.initialName - The initial project name
 * @param {function} props.onNameChange - Callback when name is changed
 */
function ProjectName({ initialName = "Untitled Character Diagram", onNameChange }) {
  const [projectName, setProjectName] = useState(initialName);
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef(null);
  
  // ✅ Update local state when initialName changes (e.g., after project save)
  useEffect(() => {
    setProjectName(initialName);
  }, [initialName]);

  // Focus the input when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleStartEditing = () => {
    setIsEditing(true);
  };

  const handleEndEditing = () => {
    setIsEditing(false);
    // ✅ Only call onNameChange if the name actually changed
    const trimmedName = projectName.trim();
    if (onNameChange && trimmedName !== initialName && trimmedName !== '') {
      onNameChange(trimmedName);
    } else if (trimmedName === '') {
      // ✅ Reset to initialName if user enters empty string
      setProjectName(initialName);
    }
  };

  const handleNameChange = (e) => {
    setProjectName(e.target.value);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleEndEditing();
    } else if (e.key === 'Escape') {
      // ✅ Reset to original name on escape
      setProjectName(initialName);
      setIsEditing(false);
    }
  };

  return (
    <div className="project-name-container">
      {isEditing ? (
        <div className="project-name-edit">
          <input
            ref={inputRef}
            type="text"
            value={projectName}
            onChange={handleNameChange}
            onBlur={handleEndEditing}
            onKeyDown={handleKeyDown}
            className="project-name-input"
            placeholder="Enter project name"
            maxLength={50}
          />
          <button 
            className="project-name-button confirm" 
            onClick={handleEndEditing}
            title="Save project name"
          >
            <Check size={16} />
          </button>
        </div>
      ) : (
        <div className="project-name-display">
          <h2 className="project-name-text">{projectName}</h2>
          <button 
            className="project-name-button edit" 
            onClick={handleStartEditing}
            title="Edit project name"
          >
            <Edit2 size={16} />
          </button>
        </div>
      )}
    </div>
  );
}

export default ProjectName;
