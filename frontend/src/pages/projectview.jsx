// frontend/src/pages/projectview.jsx
import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { projectAPI } from '../services/api';
import '../components/styles/editpage.css';
import '../components/styles/projectview.css';

// Components
import Canvas from '../components/editpage-components/Canvas';
import ReadOnlyPropertyPanel from '../components/editpage-components/ReadOnlyPropertyPanel';
import ViewOnlyToolbar from '../components/editpage-components/ViewOnlyToolbar';

function ProjectView() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { isLoggedIn, user } = useAuth();
  const canvasRef = useRef(null);
  
  const [project, setProject] = useState(null);
  const [elements, setElements] = useState([]);
  const [relationships, setRelationships] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [selectedElement, setSelectedElement] = useState(null);
  const [authorInfo, setAuthorInfo] = useState({ name: '', id: null });

  useEffect(() => {
     const loadProject = async () => {
      try {
        console.log('Loading project:', projectId); // Debug log
        const response = await projectAPI.getProject(projectId);
        const projectData = response.data.data || response.data;
        
        console.log('Project data loaded:', projectData); // Debug log
        setProject(projectData);
        
        // Set author info
        if (projectData.authorName) {
          setAuthorInfo({
            name: projectData.authorName,
            id: projectData.user_id
          });
        }
        
        if (projectData.project_data) {
          let parsedData;
          if (typeof projectData.project_data === 'string') {
            parsedData = JSON.parse(projectData.project_data);
          } else {
            parsedData = projectData.project_data;
          }
          
          console.log('Parsed project data:', parsedData); // Debug log
          
          // Set elements
          if (parsedData.elements && Array.isArray(parsedData.elements)) {
            console.log('Loading elements:', parsedData.elements.length); // Debug log
            setElements(parsedData.elements);
            window.currentElements = parsedData.elements;
          }
          
          // Set relationships
          if (parsedData.relationships && Array.isArray(parsedData.relationships)) {
            console.log('Loading relationships:', parsedData.relationships.length); // Debug log
            setRelationships(parsedData.relationships);
            window.currentRelationships = parsedData.relationships;
          } else {
            console.log('No relationships found in project data'); // Debug log
            setRelationships([]);
            window.currentRelationships = [];
          }
          
          // Store all data in window for component access
          window.projectData = {
            elements: parsedData.elements || [],
            relationships: parsedData.relationships || [],
            authorInfo: {
              name: projectData.authorName || 'Unknown Author',
              id: projectData.user_id
            }
          };
        } else {
          console.log('No project_data found'); // Debug log
          setElements([]);
          setRelationships([]);
        }
      } catch (error) {
        console.error('Error loading project:', error);
        setError('Failed to load project. It may be private or not exist.');
      } finally {
        setIsLoading(false);
      }
    };

    if (projectId) {
      loadProject();
    }
  }, [projectId]);

  const isOwner = isLoggedIn && user && project && project.user_id === user.id;

  const handleZoomIn = () => {
    setZoomLevel((prevZoom) => Math.min(prevZoom + 0.1, 2));
  };

  const handleZoomOut = () => {
    setZoomLevel((prevZoom) => Math.max(prevZoom - 0.1, 0.5));
  };

  const handleBackToHome = () => {
    navigate('/');
  };

  const handleEditProject = () => {
    if (isOwner) {
      navigate(`/edit/${projectId}`);
    }
  };

  // Enhanced element selection with relationship data
  const handleElementSelect = (elementId) => {
    console.log('Element selected:', elementId); // Debug log
    const element = elements.find(el => el.id === elementId);
    if (element) {
      // Find related relationships
      const relatedRelationships = relationships.filter(rel => 
        rel.fromId === elementId || rel.toId === elementId
      );
      
      console.log('Related relationships found:', relatedRelationships); // Debug log
      
      // Create enhanced element with relationship data
      const elementWithRelationships = {
        ...element,
        relationships: relatedRelationships,
        allElements: elements, // For name resolution
        allRelationships: relationships
      };
      
      setSelectedElement(elementWithRelationships);
    }
  };

  // Handle relationship line selection
  const handleRelationshipSelect = (relationship) => {
    console.log('Relationship selected:', relationship); // Debug log
    
    // Find connected elements
    const fromElement = elements.find(el => el.id === relationship.fromId);
    const toElement = elements.find(el => el.id === relationship.toId);
    
    setSelectedElement({
      id: `relationship_${relationship.id || relationship.fromId}_${relationship.toId}`,
      type: 'relationship',
      name: relationship.label || `${fromElement?.name || 'Unknown'} → ${toElement?.name || 'Unknown'}`,
      relationshipData: relationship,
      relationships: [relationship],
      fromElement: fromElement,
      toElement: toElement,
      allElements: elements,
      allRelationships: relationships
    });
  };

  // Handle canvas click to clear selection
  const handleCanvasClick = (event) => {
    // Only clear selection if clicking on empty canvas
    if (event.target === canvasRef.current || event.target.classList.contains('canvas-container')) {
      setSelectedElement(null);
    }
  };

  // Dummy functions for Canvas (read-only mode)
  const dummyUpdateElement = () => {
    console.log('Update element called - read-only mode');
  };
  
  const dummyCreateRelationship = () => {
    console.log('Create relationship called - read-only mode');
  };

  if (isLoading) {
    return (
      <div className="edit-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading project...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="edit-page">
        <div className="error-container">
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={handleBackToHome} className="back-button">
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="edit-page project-view-mode">
      {/* View-Only Banner */}
      {!isOwner && (
        <div className="view-only-banner">
          <span>View Only Mode - No editing allowed</span>
        </div>
      )}

      {/* Project Title Bar */}
      <div className="top-bar">
        <div className="project-name-container">
          <h2 className="project-name-text">{project?.title || 'Untitled Character Diagram'}</h2>
          
        </div>
        
        {/* View-Only Toolbar */}
        <ViewOnlyToolbar 
          zoomLevel={zoomLevel}
          handleZoomIn={handleZoomIn}
          handleZoomOut={handleZoomOut}
          onBackToHome={handleBackToHome}
          onEditProject={isOwner ? handleEditProject : null}
          isOwner={isOwner}
        />
      </div>
      
      <div className="main-content">
        {/* Canvas with full relationship support */}
        <Canvas 
          canvasRef={canvasRef}
          elements={elements} 
          relationships={relationships}
          selectedElements={selectedElement ? [selectedElement.id] : []}
          zoomLevel={zoomLevel}
          isErasing={false}
          relationshipMode={false}
          handleSelectElement={handleElementSelect}
          handleRelationshipSelect={handleRelationshipSelect}
          updateElement={dummyUpdateElement}
          createRelationship={dummyCreateRelationship}
          handleCanvasClick={handleCanvasClick}
          readOnly={true}
          isViewOnly={true}
        />
        
        {/* Read-Only Property Panel */}
        {selectedElement && (
          <ReadOnlyPropertyPanel 
            selectedElement={selectedElement}
            allElements={elements}
            allRelationships={relationships}
            projectAuthor={authorInfo.name || project?.authorName || 'Unknown Author'}
            onClose={() => setSelectedElement(null)}
          />
        )}
      </div>
    </div>
  );
}

export default ProjectView;
