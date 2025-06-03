/* eslint-disable react/prop-types */
// frontend/src/components/editpage-components/ReadOnlyPropertyPanel.jsx

import { ELEMENT_TYPES } from '../../constants/elementTypes';
import '../styles/editpage.css'; 

const ReadOnlyPropertyPanel = ({ selectedElement }) => {
  // ✅ เพิ่ม debug
  console.log('ReadOnlyPropertyPanel received:', selectedElement);
  
  if (!selectedElement) return null;
  
  // Function to render read-only fields based on element type
  const renderFields = () => {
    console.log('Rendering fields for type:', selectedElement.type); // Debug
    
    switch (selectedElement.type) {
      case ELEMENT_TYPES.CIRCLE:
        return (
          <>
            <div className="property-field">
              <label>Character Name:</label>
              <input 
                type="text" 
                value={selectedElement.text || ''} 
                readOnly
                className="readonly-input"
                placeholder="Unnamed Character"
              />
            </div>


            
            <div className="property-field">
              <label>Details:</label>
              <textarea 
                value={selectedElement.details || ''} 
                readOnly
                className="readonly-input"
                placeholder="Character details"
                rows={3}
                style={{ resize: 'none' }}
              />
            </div>
            
            <div className="property-field">
              <label>Age:</label>
              <input 
                type="text" 
                value={selectedElement.age || ''} 
                readOnly
                className="readonly-input"
                placeholder="Character age"
              />
            </div>

            <div className="property-field">
              <label>Color:</label>
              <div className="color-field-readonly">
                <input 
                  type="color" 
                  value={selectedElement.color || '#000000'} 
                  readOnly
                  disabled
                  className="readonly-color-input"
                />
                <input 
                  type="text" 
                  value={selectedElement.color || '#000000'} 
                  readOnly
                  className="readonly-input color-text"
                />
              </div>
            </div>

            <div className="property-field image-upload-field">
              <label>Profile Image:</label>
              <div className="image-readonly-container">
                {selectedElement.profileImage ? (
                  <img 
                    src={selectedElement.profileImage} 
                    alt="Character Profile" 
                    className="readonly-profile-image"
                  />
                ) : (
                  <div className="image-placeholder readonly">
                    <span>No profile image</span>
                  </div>
                )}
              </div>
            </div>
          </>
        );
        
      case ELEMENT_TYPES.TEXTBOX:
        return (
          <>
            <div className="property-field">
              <label>Text Content:</label>
              <textarea 
                value={selectedElement.text || ''} 
                readOnly
                className="readonly-input"
                placeholder="Empty text box"
                rows={4}
                style={{ resize: 'none' }}
              />
            </div>

            <div className="property-field">
              <label>Font Size:</label>
              <input 
                type="number" 
                value={selectedElement.fontSize || 14} 
                readOnly
                className="readonly-input"
              />
            </div>

            <div className="property-field">
              <label>Font Color:</label>
              <div className="color-field-readonly">
                <input 
                  type="color" 
                  value={selectedElement.fontColor || '#000000'} 
                  readOnly
                  disabled
                  className="readonly-color-input"
                />
                <input 
                  type="text" 
                  value={selectedElement.fontColor || '#000000'} 
                  readOnly
                  className="readonly-input color-text"
                />
              </div>
            </div>
        
            <div className="property-field">
              <label>Box Color:</label>
              <div className="color-field-readonly">
                <input 
                  type="color" 
                  value={selectedElement.color || '#000000'} 
                  readOnly
                  disabled
                  className="readonly-color-input"
                />
                <input 
                  type="text" 
                  value={selectedElement.color || '#000000'} 
                  readOnly
                  className="readonly-input color-text"
                />
              </div>
            </div>

            <div className="property-field">
              <label>Width:</label>
              <input 
                type="number" 
                value={selectedElement.width || 150} 
                readOnly
                className="readonly-input"
              />
            </div>

            <div className="property-field">
              <label>Height:</label>
              <input 
                type="number" 
                value={selectedElement.height || 100} 
                readOnly
                className="readonly-input"
              />
            </div>
          </>
        );
        
      case ELEMENT_TYPES.RELATIONSHIP:
        // ✅ หาชื่อตัวละครจริงแทนการใช้ ID
        { const getCharacterName = (characterId) => {
          if (window.currentElements) {
            const character = window.currentElements.find(el => el.id === characterId && el.type === ELEMENT_TYPES.CIRCLE);
            return character?.text || characterId;
          }
          return characterId;
        };

        return (
          <>
            <div className="property-field">
              <label>Relationship Label:</label>
              <input 
                type="text" 
                value={selectedElement.text || ''} 
                readOnly
                className="readonly-input"
                placeholder="Unlabeled relationship"
              />
            </div>
            
            <div className="property-field">
              <label>Connection:</label>
              <input 
                type="text" 
                value={`From: ${getCharacterName(selectedElement.sourceId)} → To: ${getCharacterName(selectedElement.targetId)}`} 
                readOnly
                className="readonly-input"
              />
            </div>

            <div className="property-field">
              <label>Line Color:</label>
              <div className="color-field-readonly">
                <input 
                  type="color" 
                  value={selectedElement.color || '#1677ff'} 
                  readOnly
                  disabled
                  className="readonly-color-input"
                />
                <input 
                  type="text" 
                  value={selectedElement.color || '#1677ff'} 
                  readOnly
                  className="readonly-input color-text"
                />
              </div>
            </div>

            {selectedElement.lineType && (
              <div className="property-field">
                <label>Line Style:</label>
                <input 
                  type="text" 
                  value={selectedElement.lineType} 
                  readOnly
                  className="readonly-input"
                />
              </div>
            )}
          </>
        ); }
        
      default:
        console.log('Unknown element type:', selectedElement.type); // Debug
        return <p>Unknown element type: {selectedElement.type}</p>;
    }
  };
  
  return (
    <div className="property-panel readonly-panel">
      <h3>Properties (View Only)</h3>
      
      <div className="element-type-label readonly">
        {selectedElement.type.charAt(0).toUpperCase() + selectedElement.type.slice(1)}
      </div>
      
      {renderFields()}

      <div className="readonly-disclaimer">
        <p>💡 All properties are displayed in read-only mode.</p>
        <p>🔒 No modifications can be made to this project.</p>
      </div>
    </div>
  );
};

export default ReadOnlyPropertyPanel;
