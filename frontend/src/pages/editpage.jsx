// frontend/src/pages/editpage.jsx
import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { projectAPI } from '../services/api';
import '../components/styles/editpage.css';

// Hooks
import useElementManager from '../hooks/useElementManager';
import useToolManager from '../hooks/useToolManager';

// Components
import ProjectName from '../components/editpage-components/ProjectName';
import Toolbar from '../components/editpage-components/Toolbar';
import EditDropdown from '../components/editpage-components/EditDropdown';
import StyleDropdown from '../components/editpage-components/RelationDropdown';
import Canvas from '../components/editpage-components/Canvas'; // ✅ Canvas ที่รวม RelationshipLayer แล้ว
import PropertyPanel from '../components/editpage-components/PropertyPanel';
import ProjectSettingsModal from '../components/editpage-components/ProjectSettingsModal';

function EditPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();
  const canvasRef = useRef(null);
  
  const [isEditDropdownOpen, setIsEditDropdownOpen] = useState(false);
  const [isStyleDropdownOpen, setIsStyleDropdownOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [projectName, setProjectName] = useState("Untitled Character Diagram");
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [relationshipType, setRelationshipType] = useState("generic");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [currentProject, setCurrentProject] = useState(null);

  const {
    elements,
    selectedElements,
    selectedElement,
    handleSelectElement,
    addElement,
    updateElement,
    removeElement,
    createRelationship,
    toggleElementVisibility,
    triggerImageUpload,
    clearSelection,
    setElements,
    getRelationshipStats
  } = useElementManager(canvasRef);

  const {
    activeTool,
    isErasing,
    relationshipMode,
    zoomLevel,
    setTool,
    toggleEdit,
    toggleEraser,
    toggleRelationshipMode,
    handleZoomIn,
    handleZoomOut
  } = useToolManager();

  // Check authentication
  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
  }, [isLoggedIn, navigate]);

  // Load project
  useEffect(() => {
    const loadProject = async () => {
      if (projectId && isLoggedIn) {
        setIsLoading(true);
        try {
          const response = await projectAPI.getProject(projectId);
          const project = response.data.data || response.data;
          
          setCurrentProject(project);
          setProjectName(project.title);
          
          if (project.project_data) {
            const projectData = typeof project.project_data === 'string'
              ? JSON.parse(project.project_data)
              : project.project_data;

            if (projectData.elements) {
              setElements(projectData.elements);
            }
          }

          setUnsavedChanges(false);
        } catch (error) {
          console.error('Error loading project:', error);
          alert('Failed to load project. You may not have permission to edit this project.');
          navigate('/');
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadProject();
  }, [projectId, isLoggedIn, navigate]);

  useEffect(() => {
    if (currentProject) {
      setUnsavedChanges(true);
    }
  }, [elements, projectName]);

  useEffect(() => {
    if (!currentProject || !unsavedChanges) return;

    const autoSaveInterval = setInterval(async () => {
      if (unsavedChanges && elements.length > 0) {
        try {
          await projectAPI.autoSave(currentProject.id, elements);
          console.log('Auto-saved project');
        } catch (error) {
          console.error('Auto-save failed:', error);
        }
      }
    }, 30000);

    return () => clearInterval(autoSaveInterval);
  }, [currentProject, unsavedChanges, elements]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        clearSelection();
        if (isErasing) toggleEraser();
        if (relationshipMode) toggleRelationshipMode();
      }

      if (e.ctrlKey || e.metaKey) {
        if (e.key === 's') {
          e.preventDefault();
          handleSave();
        }
        if (e.key === 'd') {
          e.preventDefault();
          if (selectedElement) {
            updateElement(selectedElement.id);
          }
        }
      }
    };

    const handleClickOutside = (event) => {
      const isToolbarClick = event.target.closest('.toolbar');
      const isPropertyPanelClick = event.target.closest('.property-panel');
      
      if (!isToolbarClick && !isPropertyPanelClick &&
          !canvasRef.current?.contains(event.target)) {
        setIsEditDropdownOpen(false);
        setIsStyleDropdownOpen(false);
      }
    };

    const handleBeforeUnload = (e) => {
      if (unsavedChanges) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return e.returnValue;
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isErasing, relationshipMode, unsavedChanges, clearSelection, toggleEraser, toggleRelationshipMode, selectedElement]);

  const handleSave = async () => {
    if (!isLoggedIn) {
      alert('You must be logged in to save projects.');
      return;
    }

    setIsSaving(true);
    try {
      const projectData = {
        elements,
        metadata: {
          version: "1.0",
          updatedAt: new Date().toISOString(),
          stats: getRelationshipStats()
        }
      };

      if (currentProject) {
        const updates = {
          title: projectName,
          project_data: JSON.stringify(projectData)
        };

        await projectAPI.updateProject(currentProject.id, updates);
        await projectAPI.saveProjectData(currentProject.id, JSON.stringify(projectData));
        alert('Project saved successfully!');
      } else {
        const newProjectData = {
          title: projectName,
          description: null,
          project_data: JSON.stringify(projectData)
        };

        const response = await projectAPI.createProject(newProjectData);
        const newProject = response.data.data || response.data;
        setCurrentProject(newProject);

        navigate(`/edit/${newProject.id}`, { replace: true });
        alert('Project created and saved successfully!');
      }

      setUnsavedChanges(false);
    } catch (error) {
      console.error('Error saving project:', error);
      alert('Failed to save project. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLoad = () => {
    navigate('/');
  };

  const handleToggleEdit = () => {
    setIsEditDropdownOpen(!isEditDropdownOpen);
    setIsStyleDropdownOpen(false);
    toggleEdit();
  };

  const handleCanvasClick = () => {
    setIsEditDropdownOpen(false);
    setIsStyleDropdownOpen(false);
  };

  const handleAddElement = (type) => (e) => {
    const newElement = addElement(type)(e);
    setIsEditDropdownOpen(false);
    return newElement;
  };

  const handleProjectNameChange = (newName) => {
    setProjectName(newName);
    setUnsavedChanges(true);
  };

  // Settings save function
  const handleSettingsSave = async (updates) => {
    setIsSaving(true);
    try {
      if (currentProject) {
        await projectAPI.updateProject(currentProject.id, updates);
        setCurrentProject({ ...currentProject, ...updates });
        if (updates.title) {
          setProjectName(updates.title);
        }
        setUnsavedChanges(false);
        alert('Project settings saved successfully!');
      }
    } catch (error) {
      console.error('Error saving project settings:', error);
      alert('Failed to save project settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const enhancedHandleSelectElement = (id, options = {}) => {
    handleSelectElement(id, { ...options, relationshipType });
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

  return (
    <div className="edit-page">
      <div className="top-bar">
        <ProjectName 
          initialName={projectName} 
          onNameChange={handleProjectNameChange}
          unsavedChanges={unsavedChanges}
        />
        
        <Toolbar 
          activeTool={activeTool}
          relationshipMode={relationshipMode}
          zoomLevel={zoomLevel}
          setTool={setTool}
          toggleEdit={handleToggleEdit}
          toggleRelationshipMode={toggleRelationshipMode}
          handleZoomIn={handleZoomIn}
          handleZoomOut={handleZoomOut}
          onSave={handleSave}
          onLoad={handleLoad}
          onOpenSettings={() => setIsSettingsModalOpen(true)}
          isSaving={isSaving}
          unsavedChanges={unsavedChanges}
        />
      </div>
      
      <EditDropdown 
        isOpen={isEditDropdownOpen}
        addElement={handleAddElement} 
      />

      <StyleDropdown 
        isOpen={isStyleDropdownOpen}
        selectedElement={selectedElement} 
        relationshipType={relationshipType}
        setRelationshipType={setRelationshipType}
      />
      
      <div className="main-content">
        {/* ✅ Canvas ที่รวม RelationshipLayer แล้ว - ไม่ต้องมี RelationshipLayer แยก */}
        <Canvas 
          canvasRef={canvasRef}
          elements={elements} 
          selectedElements={selectedElements}
          zoomLevel={zoomLevel}
          isErasing={isErasing}
          relationshipMode={relationshipMode}
          handleSelectElement={enhancedHandleSelectElement}
          updateElement={updateElement}
          createRelationship={createRelationship}
          handleCanvasClick={handleCanvasClick}
        />
        
        {selectedElement && (
          <PropertyPanel 
            selectedElement={selectedElement} 
            updateElement={updateElement} 
            removeElement={removeElement} 
            toggleElementVisibility={toggleElementVisibility} 
            triggerImageUpload={triggerImageUpload} 
          />
        )}
      </div>

      {/* Project Settings Modal */}
      <ProjectSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        project={currentProject}
        onSave={handleSettingsSave}
        isLoading={isSaving}
      />
    </div>
  );
}

export default EditPage;
