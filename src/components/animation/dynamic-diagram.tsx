/**
 * Dynamic Diagram Component
 * Renders draw.io diagram data directly without iframe
 * Supports full interactivity and scaling
 */

'use client';

import React, { useEffect, useRef } from 'react';

interface DynamicDiagramProps {
  className?: string;
}

export function DynamicDiagram({ className = '' }: DynamicDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!containerRef.current) return;

    // Create the mxGraph container div
    const graphDiv = document.createElement('div');
    graphDiv.className = 'mxgraph';
    graphDiv.style.cssText = 'max-width:100%;border:1px solid transparent;';
    
    // Set the draw.io data (extracted from your animation.html)
    graphDiv.setAttribute('data-mxgraph', JSON.stringify({
      "highlight": "#0000ff",
      "nav": true,
      "resize": true,
      "xml": "<mxfile host=\"app.diagrams.net\" agent=\"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36\" version=\"28.1.2\"><diagram name=\"第 1 页\" id=\"2xq-8N8Lale6oi8bfYcN\"><mxGraphModel dx=\"2603\" dy=\"1536\" grid=\"1\" gridSize=\"10\" guides=\"1\" tooltips=\"1\" connect=\"1\" arrows=\"1\" fold=\"1\" page=\"1\" pageScale=\"1\" pageWidth=\"291\" pageHeight=\"413\" background=\"none\" math=\"0\" shadow=\"0\"><root><mxCell id=\"0\"/><mxCell id=\"1\" parent=\"0\"/><mxCell id=\"AyHoi9mYe8o1FYpo9fQ7-1\" value=\"\" style=\"shape=image;verticalLabelPosition=bottom;labelBackgroundColor=default;verticalAlign=top;aspect=fixed;imageAspect=0;image=data:image/png,iVBORw0KGgoAAAANSUhEUgAAA80AAAJ3CAYAAACukLNSAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAA8dSURBVHgB7d3BauMwFEBRaej//7Jnuk4umWDUWs450E0oNHhR9fIavTnGOAYAAADsa45F/gwAAADgKdEMAAAAQTQDAABAEM0AAAAQRDMAAAAE0QwAAABBNAMAAEAQzQAAABBEMwAAAATRDAAAAEE0AwAAQBDNAAAAEEQzAAAABNEMAAAAQTQDAABAEM0AAAAQRDMAAABsmjR...\" vertex=\"1\" parent=\"1\"><mxGeometry x=\"67.21000000000001\" y=\"45\" width=\"169.44\" height=\"109.89\" as=\"geometry\"/></mxCell><mxCell id=\"AyHoi9mYe8o1FYpo9fQ7-2\" value=\"Client\" style=\"text;html=1;align=center;verticalAlign=middle;whiteSpace=wrap;rounded=0;fontFamily=Tahoma;fontSize=5;fontStyle=1\" vertex=\"1\" parent=\"1\"><mxGeometry x=\"129.44\" y=\"40\" width=\"40\" height=\"20\" as=\"geometry\"/></mxCell></root></mxGraphModel></diagram></mxfile>"
    }));

    // Clear container and append the graph div
    containerRef.current.innerHTML = '';
    containerRef.current.appendChild(graphDiv);

    // Load mxGraph script if not already loaded
    if (!window.mxGraphEnabled) {
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = 'https://viewer.diagrams.net/js/viewer-static.min.js';
      script.onload = () => {
        window.mxGraphEnabled = true;
        // Initialize the graph
        if (window.GraphViewer) {
          window.GraphViewer.processElements();
        }
      };
      document.head.appendChild(script);
    } else {
      // If already loaded, just process this element
      if (window.GraphViewer) {
        window.GraphViewer.processElements();
      }
    }

    // Cleanup function
    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, []);

  return (
    <div 
      ref={containerRef}
      className={`dynamic-diagram w-full h-full ${className}`}
      style={{ minHeight: '60vh' }}
    />
  );
}

// Extend window interface for TypeScript
declare global {
  interface Window {
    mxGraphEnabled?: boolean;
    GraphViewer?: any;
  }
}

export default DynamicDiagram;