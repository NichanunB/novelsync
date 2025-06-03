import React, { useEffect, useRef, useState } from 'react';
import { ELEMENT_TYPES } from '../../constants/elementTypes';
import { calculateRelationshipPosition } from '../../utils/helpers';
import '../styles/editpage.css';

const splitLongWordToFit = (ctx, word, maxWidth) => {
  const parts = [];
  let part = '';
  for (let i = 0; i < word.length; i++) {
    const test = part + word[i];
    if (ctx.measureText(test).width > maxWidth) {
      if (part.length === 0) break;
      parts.push(part);
      part = word[i];
    } else {
      part = test;
    }
  }
  if (part) parts.push(part);
  return parts;
};

// Helper function to render elements
const renderElement = (ctx, element, isSelected, zoomLevel) => {
  if (element.hidden) return;

  ctx.save();

  const zoomedX = element.x * zoomLevel;
  const zoomedY = element.y * zoomLevel;

  if (isSelected) {
    ctx.strokeStyle = '#1677ff';
    ctx.lineWidth = 2;
  } else {
    ctx.strokeStyle = element.color || '#000000';
    ctx.lineWidth = 1;
  }

  switch (element.type) {
    case ELEMENT_TYPES.CIRCLE: {
      const radius = (element.width / 2) * zoomLevel;

      ctx.beginPath();
      ctx.arc(zoomedX, zoomedY, radius, 0, Math.PI * 2);

      switch (element.characterType) {
        case 'protagonist':
          ctx.fillStyle = '#e6f7ff';
          break;
        case 'antagonist':
          ctx.fillStyle = '#fff1f0';
          break;
        case 'supporting':
          ctx.fillStyle = '#f6ffed';
          break;
        default:
          ctx.fillStyle = '#ffffff';
      }

      ctx.fill();
      ctx.stroke();

      if (element.profileImage) {
        const img = new Image();
        img.src = element.profileImage;

        img.onload = () => {
          ctx.save();
          ctx.beginPath();
          ctx.arc(zoomedX, zoomedY, radius * 0.9, 0, Math.PI * 2);
          ctx.clip();

          const size = radius * 1.8;
          ctx.drawImage(img, zoomedX - size / 2, zoomedY - size / 2, size, size);
          ctx.restore();
        };
      }

      if (element.text) {
        ctx.fillStyle = '#000000';
        ctx.font = `${12 * zoomLevel}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText(element.text, zoomedX, zoomedY + radius + 20 * zoomLevel);
      }
      break;
    }

    case ELEMENT_TYPES.TEXTBOX: {
      const width = element.width * zoomLevel;
      const height = element.height * zoomLevel;
      const padding = 8 * zoomLevel;
      const fontSize = (element.fontSize || 14) * zoomLevel;
      const lineHeight = fontSize * 1.4;

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(zoomedX - width / 2, zoomedY - height / 2, width, height);
      ctx.strokeRect(zoomedX - width / 2, zoomedY - height / 2, width, height);

      if (element.text) {
        ctx.font = `${fontSize}px Arial`;
        ctx.fillStyle = element.fontColor || '#000000';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';

        const words = element.text.split(/\s+/);
        const maxWidth = width - padding * 2;
        let y = zoomedY - height / 2 + padding;
        let line = '';

        for (let i = 0; i < words.length; i++) {
          const word = words[i];
          const testLine = line + word + ' ';
          const testWidth = ctx.measureText(testLine.trim()).width;

          if (testWidth > maxWidth) {
            if (ctx.measureText(word).width > maxWidth) {
              const parts = splitLongWordToFit(ctx, word, maxWidth);
              ctx.fillText(line.trim(), zoomedX - width / 2 + padding, y);
              y += lineHeight;
              parts.forEach((part) => {
                if (y + lineHeight > zoomedY + height / 2 - padding) return;
                ctx.fillText(part.trim(), zoomedX - width / 2 + padding, y);
                y += lineHeight;
              });
              line = '';
            } else {
              ctx.fillText(line.trim(), zoomedX - width / 2 + padding, y);
              line = word + ' ';
              y += lineHeight;
            }
            if (y + lineHeight > zoomedY + height / 2 - padding) break;
          } else {
            line = testLine;
          }
        }
        if (y + lineHeight <= zoomedY + height / 2 - padding) {
          ctx.fillText(line.trim(), zoomedX - width / 2 + padding, y);
        }
      }
      break;
    }

    case ELEMENT_TYPES.LINE: {
      ctx.beginPath();
      ctx.moveTo(zoomedX, zoomedY);
      ctx.lineTo(zoomedX + (element.width * zoomLevel), zoomedY);
      ctx.stroke();
      break;
    }

    default:
      break;
  }

  ctx.restore();
};

const Canvas = ({ 
  canvasRef,
  elements, 
  selectedElements, 
  zoomLevel, 
  isErasing,
  relationshipMode,
  handleSelectElement, 
  updateElement,
  handleCanvasClick 
}) => {
  const canvasContext = useRef(null);
  const svgRef = useRef(null);
  
  // State for dragging
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [draggedElementIds, setDraggedElementIds] = useState([]);
  
  // Initialize canvas on mount
  useEffect(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    canvasContext.current = ctx;
    
    // Set canvas dimensions
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    
    // Initial render
    renderCanvas();
    
    // Handle resize
    const handleResize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      renderCanvas();
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [canvasRef]);
  
  // Re-render when elements or selection changes
  useEffect(() => {
    renderCanvas();
  }, [elements, selectedElements, zoomLevel]);
  
  // Function to render all elements on the canvas
  const renderCanvas = () => {
    if (!canvasRef.current || !canvasContext.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvasContext.current;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw grid (optional)
    drawGrid(ctx, canvas.width, canvas.height, zoomLevel);
    
    // Render non-relationship elements
    elements
      .filter(element => element.type !== ELEMENT_TYPES.RELATIONSHIP)
      .forEach(element => {
        renderElement(
          ctx, 
          element, 
          selectedElements.includes(element.id),
          zoomLevel
        );
      });
  };
  
  // Draw a grid on the canvas
  const drawGrid = (ctx, width, height, zoom) => {
    const gridSize = 20 * zoom;
    
    ctx.save();
    ctx.strokeStyle = '#f0f0f0';
    ctx.lineWidth = 0.5;
    
    // Draw vertical lines
    for (let x = 0; x < width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    
    // Draw horizontal lines
    for (let y = 0; y < height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    
    ctx.restore();
  };
  
  // Function to check if a point is within an element
  const isPointInElement = (x, y, element) => {
    if (element.hidden) return false;
    
    switch (element.type) {
      case ELEMENT_TYPES.CIRCLE:
        const radius = element.width / 2;
        const distance = Math.sqrt(
          Math.pow(element.x - x, 2) + Math.pow(element.y - y, 2)
        );
        return distance <= radius;
        
      case ELEMENT_TYPES.TEXTBOX:
        return (
          x >= element.x - element.width/2 &&
          x <= element.x + element.width/2 &&
          y >= element.y - element.height/2 &&
          y <= element.y + element.height/2
        );
        
      case ELEMENT_TYPES.LINE:
        const lineEndX = element.x + element.width;
        // For simplicity, we'll consider a small area around the line
        return (
          x >= element.x - 5 &&
          x <= lineEndX + 5 &&
          y >= element.y - 5 &&
          y <= element.y + 5
        );
        
      default:
        return false;
    }
  };
  
  // Handle mouse down for starting drag
  const handleMouseDown = (e) => {
    if (isErasing) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoomLevel;
    const y = (e.clientY - rect.top) / zoomLevel;
    
    // Find clicked element (excluding relationships)
    const clickedElement = [...elements]
      .filter(element => element.type !== ELEMENT_TYPES.RELATIONSHIP)
      .reverse()
      .find(element => isPointInElement(x, y, element));
    
    if (clickedElement) {
      // Start dragging the clicked element
      setIsDragging(true);
      setDragStart({ x, y });
      
      // If the clicked element is not already selected, select only this element
      if (!selectedElements.includes(clickedElement.id)) {
        handleSelectElement(clickedElement.id, { isErasing, relationshipMode });
        setDraggedElementIds([clickedElement.id]);
      } else {
        // If already selected, keep current selection and drag all selected elements
        setDraggedElementIds([...selectedElements]);
      }
      
      // Close any open dropdowns
      if (handleCanvasClick) {
        handleCanvasClick();
      }
    } else {
      // Clear selection if clicking empty space
      handleSelectElement(null);
      setDraggedElementIds([]);
      
      // Close any open dropdowns
      if (handleCanvasClick) {
        handleCanvasClick();
      }
    }
  };
  
  // Handle mouse move for dragging
  const handleMouseMove = (e) => {
    if (!isDragging || draggedElementIds.length === 0 || isErasing || relationshipMode) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoomLevel;
    const y = (e.clientY - rect.top) / zoomLevel;

    // Calculate distance moved
    const dx = x - dragStart.x;
    const dy = y - dragStart.y;

    // Update drag start for the next move
    setDragStart({ x, y });

    // Update position for all dragged elements
    draggedElementIds.forEach((id) => {
      const element = elements.find((el) => el.id === id);
      if (element) {
        updateElement(id, {
          x: element.x + dx,
          y: element.y + dy,
        });
      }
    });
  };

  // Handle mouse up to end dragging
  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false);
      setDraggedElementIds([]);
    }
  };
  
  // Handle mouse out to end dragging if cursor leaves canvas
  const handleMouseOut = () => {
    setIsDragging(false);
  };

  // ✅ Helper function สำหรับ Relationship
  const getElementById = (id) => elements.find(el => el.id === id);

  // ✅ ฟังก์ชันคำนวณจุดที่เส้นตัดกับขอบวงกลม (แก้ไขแล้ว)
const calculateEdgePoints = (sourceEl, targetEl) => {
  // Debug: ตรวจสอบค่า element
  console.log('Source Element:', { x: sourceEl.x, y: sourceEl.y, width: sourceEl.width });
  console.log('Target Element:', { x: targetEl.x, y: targetEl.y, width: targetEl.width });
  
  // ใช้ x, y ของ element โดยตรง เพราะเป็นจุดศูนย์กลางอยู่แล้ว
  const sourceCenterX = sourceEl.x;
  const sourceCenterY = sourceEl.y;
  const targetCenterX = targetEl.x;
  const targetCenterY = targetEl.y;
  
  // ตรวจสอบว่าระยะห่างระหว่าง element ไม่เป็น 0
  const dx = targetCenterX - sourceCenterX;
  const dy = targetCenterY - sourceCenterY;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  if (distance === 0) {
    // หาก element อยู่ตำแหน่งเดียวกัน ให้วาดเส้นสั้นๆ
    return {
      x1: sourceCenterX,
      y1: sourceCenterY,
      x2: sourceCenterX + 50,
      y2: sourceCenterY
    };
  }
  
  const angle = Math.atan2(dy, dx);
  
  // คำนวณรัศมีของแต่ละ element
  const sourceRadius = (sourceEl.width || 100) / 2;
  const targetRadius = (targetEl.width || 100) / 2;
  
  // คำนวณจุดที่ขอบของวงกลม
  const sourceEdgeX = sourceCenterX + Math.cos(angle) * sourceRadius;
  const sourceEdgeY = sourceCenterY + Math.sin(angle) * sourceRadius;
  
  const targetEdgeX = targetCenterX - Math.cos(angle) * targetRadius;
  const targetEdgeY = targetCenterY - Math.sin(angle) * targetRadius;
  
  const result = {
    x1: sourceEdgeX,
    y1: sourceEdgeY,
    x2: targetEdgeX,
    y2: targetEdgeY
  };
  
  console.log('Calculated Edge Points:', result);
  return result;
};

// ✅ ทางเลือก: ใช้ฟังก์ชัน calculateRelationshipPosition ที่มีอยู่แล้ว
const calculateEdgePointsAlternative = (sourceEl, targetEl) => {
  // ใช้ฟังก์ชันที่ import มาจาก utils/helpers
  return calculateRelationshipPosition(sourceEl, targetEl);
};

  // ✅ ฟังก์ชัน Render Relationships
  const validRelationships = elements
    .filter(element =>
      element.type === ELEMENT_TYPES.RELATIONSHIP &&
      !element.hidden &&
      element.sourceId &&
      element.targetId &&
      getElementById(element.sourceId) &&
      getElementById(element.targetId) &&
      !getElementById(element.sourceId).hidden &&
      !getElementById(element.targetId).hidden
    )
    .map(relationship => {
      const sourceEl = getElementById(relationship.sourceId);
      const targetEl = getElementById(relationship.targetId);
      
      const position = calculateEdgePoints(sourceEl, targetEl);
      
      return { relationship, position, isValid: !!position };
    });

  const renderArrowMarker = () => (
    <defs>
      <marker
        id="arrowhead"
        markerWidth="10"
        markerHeight="7"
        refX="9"
        refY="3.5"
        orient="auto">
        <polygon points="0 0, 10 3.5, 0 7" fill="#1677ff" />
      </marker>
      <marker
        id="family-arrowhead"
        markerWidth="10"
        markerHeight="7"
        refX="9"
        refY="3.5"
        orient="auto">
        <polygon points="0 0, 10 3.5, 0 7" fill="#fa541c" />
      </marker>
      {/* Dynamic markers for custom colors */}
      {validRelationships.map(({ relationship }) => (
        <marker
          key={`marker-${relationship.id}`}
          id={`arrowhead-${relationship.id}`}
          markerWidth="10"
          markerHeight="7"
          refX="9"
          refY="3.5"
          orient="auto">
          <polygon points="0 0, 10 3.5, 0 7" fill={relationship.color || "#1677ff"} />
        </marker>
      ))}
    </defs>
  );

  const getStrokeDashArray = (lineType) => {
    switch (lineType) {
      case 'dashed':
        return '8,4';
      case 'dotted':
        return '2,2';
      case 'dashdot':
        return '8,4,2,4';
      default:
        return 'none';
    }
  };
  
  return (
    <div className="canvas-container">
      <canvas
        ref={canvasRef}
        className="diagram-canvas"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseOut={handleMouseOut}
        style={{ cursor: isDragging ? 'grabbing' : 'default' }}
      />
      
      {/* ✅ SVG Layer สำหรับ Relationships */}
      <svg 
        ref={svgRef}
        className="relationships-layer"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 5
        }}
      >
        {renderArrowMarker()}

        {validRelationships
          .filter(rel => rel.isValid)
          .map(({ relationship, position }) => {
            if (!position) return null;

            const { x1, y1, x2, y2 } = position;
            const midX = (x1 + x2) / 2;
            const midY = (y1 + y2) / 2;
            const isSelected = selectedElements.includes(relationship.id);
            
            const isChild = relationship.relationshipType === 'child-of';
            const color = relationship.color || (isChild ? '#fa541c' : '#1677ff');
            const markerId = `arrowhead-${relationship.id}`;
            const lineType = relationship.lineType || 'solid';

            // Calculate label position with better positioning
            const angle = Math.atan2(y2 - y1, x2 - x1);
            const labelOffsetX = Math.sin(angle) * 20;
            const labelOffsetY = -Math.cos(angle) * 20;

            return (
              <g key={relationship.id}>
                {/* Main relationship line */}
                <line
                  x1={x1 * zoomLevel}
                  y1={y1 * zoomLevel}
                  x2={x2 * zoomLevel}
                  y2={y2 * zoomLevel}
                  stroke={color}
                  strokeWidth={isSelected ? 4 : 2}
                  strokeDasharray={getStrokeDashArray(lineType)}
                  markerEnd={relationship.directed ? `url(#${markerId})` : ""}
                  className={`relationship-line ${isSelected ? 'selected' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectElement(relationship.id);
                  }}
                  style={{ 
                    cursor: 'pointer',
                    filter: isSelected ? 'drop-shadow(0 0 3px rgba(22, 119, 255, 0.5))' : 'none',
                    pointerEvents: 'auto'
                  }}
                />

                {/* Invisible thicker line for easier clicking */}
                <line
                  x1={x1 * zoomLevel}
                  y1={y1 * zoomLevel}
                  x2={x2 * zoomLevel}
                  y2={y2 * zoomLevel}
                  stroke="transparent"
                  strokeWidth="12"
                  style={{ cursor: 'pointer', pointerEvents: 'auto' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectElement(relationship.id);
                  }}
                />

                {/* Relationship label */}
                <g transform={`translate(${(midX + labelOffsetX) * zoomLevel}, ${(midY + labelOffsetY) * zoomLevel})`}>
                  {/* Label background */}
                  <rect
                    x="-50"
                    y="-10"
                    width="80"
                    height="20"
                    fill="white"
                    stroke={isSelected ? color : '#ddd'}
                    strokeWidth={isSelected ? 2 : 1}
                    rx="10"
                    ry="10"
                    className="relationship-label-bg"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectElement(relationship.id);
                    }}
                    style={{ pointerEvents: 'auto', cursor: 'pointer' }}
                  />
                  
                  {/* Label text */}
                  <foreignObject
                    x="-45"
                    y="-8"
                    width="70"
                    height="16"
                    className="relationship-label-container"
                  >
                    {isSelected ? (
                      <input
                        type="text"
                        value={relationship.text || ''}
                        placeholder="relationship"
                        className="relationship-label-input"
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => updateElement(relationship.id, { text: e.target.value })}
                        autoFocus
                        style={{
                          width: '100%',
                          border: 'none',
                          background: 'transparent',
                          textAlign: 'center',
                          fontSize: `${12 * zoomLevel}px`,
                          outline: 'none',
                          color: '#333',
                          pointerEvents: 'auto'
                        }}
                      />
                    ) : (
                      <div
                        className="relationship-label-display"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectElement(relationship.id);
                        }}
                        style={{
                          textAlign: 'center',
                          fontSize: `${12 * zoomLevel}px`,
                          color: '#333',
                          cursor: 'pointer',
                          lineHeight: '16px',
                          pointerEvents: 'auto'
                        }}
                      >
                        {relationship.text || 'relationship'}
                      </div>
                    )}
                  </foreignObject>
                </g>
              </g>
            );
          })}
      </svg>
    </div>
  );
};

export default Canvas;
