/*
Copyright � 2000 Alber Sanchez <albhasan@gmail.com>
This work is free. You can redistribute it and/or modify it under the
terms of the Do What The Fuck You Want To Public License, Version 2,
as published by Sam Hocevar. See the COPYING file for more details.
*/

var map;//Map container
var mapImage;//Map container for the image
var imageMapMaxSize = 10;//Maximum size of the image in map units
var imgModelOriginal;//Representation of the image
var imgModelScaled;//Scaled representation of the image to fit the map container
var cpManager = new ControlPointManager();
var mkManager;
var imageMapLayer;
var cpTable;//Table of control points. It must be outside of the ready function


var mapAreaVertexTable;//


var imageBoundaryOnMap;
var imageMapAreaOnMap;
var drawnItemsImage = new L.FeatureGroup();
var drawnItemsMap = new L.FeatureGroup();
var trans;//Transformation
var imageMapArea;//Area of the mapArea in the image (pixels)

//Metadata holding variables
var paperMapSize;
var paperMapScale;
var paperMapPlaces;
var paperMapDescription;
var mapAreawkt;
var presentation;

$(document).ready(function () {
	c = Constants.getInstance();
	$( document ).tooltip();//enables JQuery UI tooltips
	
	//------------------------------------------
	// Initialization
	//------------------------------------------
	initmap();
	
	$('#controlPointsTableDiv').html( '<table cellpadding="0" cellspacing="0" border="0" class="display" id="controlPointsTable"></table>' );
	cpTable = $('#controlPointsTable').dataTable( {
		"aaData": null,
		"aoColumns": [
			{ "sTitle": "CP Id", "sClass": "center", "bVisible": true},
			{ "sTitle": "Im X", "sClass": "center", "bVisible": false},
			{ "sTitle": "Im Y", "sClass": "center", "bVisible": false},
			{ "sTitle": "Map X", "sClass": "center", "bVisible": false},
			{ "sTitle": "Map Y", "sClass": "center", "bVisible": false}
		]
	} ); 
	
	$('#mapAreaVertexTableDiv').html( '<table cellpadding="0" cellspacing="0" border="0" class="display" id="mapAreaVertexTable"></table>' );
	mapAreaVertexTable = $('#mapAreaVertexTable').dataTable( {
		"bFilter": false,
		"bInfo": false,
		"bSort": false,
		"bPaginate": false,
		"aaData": null,
		"aoColumns": [
			{ "sTitle": "X", "sClass": "center", "bVisible": false},
			{ "sTitle": "Y", "sClass": "center", "bVisible": false},
		]
	} ); 
	
	
	//Adds the combo with the ontology classes
	$.get(c.getConstant("ONTOLOGY_URL"), function(xmlResponse){
		var rdfClasses = getRdfClasses(xmlResponse);
		var counter = 0;
		for(var i = 0; i < rdfClasses.length; i++){
			if(rdfClasses[i].children.length == 0){
				$("#contentTags").append("<p id='pOntologyContentTag" + counter +"'><input type='checkbox' id='" + rdfClasses[i].name + "' value='" + rdfClasses[i].uri + "' class='chOntologyContent' >" + rdfClasses[i].name + " - <a href='" + rdfClasses[i].uri + "' target='_blank'>view</a> <a href='javascript: void(0)' onclick='removeElement(&quot;pOntologyContentTag" + counter + "&quot;)'>remove</a></p>");				
				counter++;
			}
		}
	}) 


	
	//SPECIFIC AUTHOR NAME SEARCH ON THE LIBRARY OF MUENSTER
	//Comment this function for deactivate the autocomplete
	//Autocomplete functions for map creator from LOBID
    $('#paperMapCreator').each(function() {
        var $input = $(this);
        $input.autocomplete({
            source : function(request, response) {
                $.ajax({
                    url : "http://api.lobid.org/person",
                    dataType : "jsonp",
                    data : {
                        name : request.term,
                        format : "ids"
                    },
                    success : function(data) {
                        response(data);
                    }
                });
            }
        });
    });	
	
	
	
	
	//------------------------------------------
	//LEAFLET http://leafletjs.com/
	//------------------------------------------
	
	
	/**
	*Initialize the maps.
	*/
	function initmap(){

		//Map start - The origin of the image in the map is 0,0 and it falls in the 1st quadrant.
		map = L.map('map').setView([51.96236,7.62571], 12);//Default CRS is EPSG3857 spherical mercator -- http://www.epsg-registry.org/report.htm?type=selection&entity=urn:ogc:def:crs:EPSG::3857&reportDetail=short&style=urn:uuid:report-style:default-with-code&style_name=OGP%20Default%20With%20Code&title=EPSG:3857
		mapImage = L.map('mapImage', {center: [imageMapMaxSize/2, imageMapMaxSize/2],zoom: 12,crs: L.CRS.Simple});	//Plane SRS to put the map-image
		mkManager = new MarkerManager(cpManager, drawnItemsImage, drawnItemsMap);
		
		//Adds layers
		/*L.tileLayer('http://{s}.tile.cloudmade.com/BC9A493B41014CAABB98F0471D759707/997/256/{z}/{x}/{y}.png', {
			maxZoom: 18,
			attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery � <a href="http://cloudmade.com">CloudMade</a>'
		}).addTo(map);*/
		
		
		
		L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
			attribution: '&amp;copy; &lt;a href="http://osm.org/copyright"&gt;OpenStreetMap&lt;/a&gt; contributors'
		}).addTo(map);
		
		
		
		//Leaflet draw options
		mapImage.addLayer(drawnItemsImage);
		map.addLayer(drawnItemsMap);
		var drawControlImage = new L.Control.Draw({
			draw: {
				polyline: {
					title: 'Draw a 20 cms line',
					allowIntersection: false, // Restricts shapes to simple polygons
					drawError: {
						color: '#FF0000', // Color the shape will turn when intersects
						message: '<strong>Oh snap!<strong> you can\'t draw that!' // Message that will show when intersect
					},
					shapeOptions: {
						color: '#00FF00'
					}
				},
				polygon: {
					title: 'Draw a Map Area on Image',
					allowIntersection: false,
					drawError: {
						color: '#FF0000', // Color the shape will turn when intersects
						message: '<strong>Oh snap!<strong> you can\'t draw that!' // Message that will show when intersect
					},
					shapeOptions: {
						color: '#0000FF'
					}
				},
				circle: false,
				rectangle: false,
				marker: {
					title: 'Add an Image Control Point'
				}
			},
			edit: {
				featureGroup: drawnItemsImage,
				edit: false//TODO: Unables edition but it's not working
			}
		});
		var drawControlMap = new L.Control.Draw({
			draw: {
				polyline: false,
				polygon: false,
				circle: false,
				rectangle: false,
				marker: {
					title: 'Add a Map Control Point'
				}
			},
			edit: {
				featureGroup: drawnItemsMap,
				edit: false//TODO: Unables edition not working
			}
		});
		mapImage.addControl(drawControlImage);
		map.addControl(drawControlMap);
		
		//Map event
		mapImage.on('draw:created', function(e) {
			var type = e.layerType;
			var layer = e.layer;
			if(imageMapLayer != null){
				if (type === 'marker') {
					var ll = layer.getLatLng();
					if(imgModelScaled.getScaledImage().isInside_Image1q(ll.lng, ll.lat)){
						//Transform to image coords
						var xyImgScl1Q = [ll.lng, ll.lat];
						var xyImgScl = imgModelScaled.getScaledImage().image1q2image(xyImgScl1Q[0], xyImgScl1Q[1]);
						var xyImgOriginal = imgModelScaled.unScaleCoords(xyImgScl[0], xyImgScl[1]);
						var cpId = mkManager.addImageMarkerImgScaled1Q(layer, imgModelScaled);
						updateImageControlPointInTable(cpTable, cpId, xyImgOriginal[0], xyImgOriginal[1]);
						projectImageBoundaries(cpManager, imgModelScaled, mkManager.getMapAreaCoords(), map);
					}
				}
				if(type === 'polygon'){
					mkManager.addMapArea(layer);
					projectImageBoundaries(cpManager, imgModelScaled, mkManager.getMapAreaCoords(), map);
				}
				if(type === 'polyline'){
					mkManager.addRuler(layer);
					printRulerProperties(mkManager.getRulerCoords(), imgModelScaled);
				}
			}
			updateMetadata();
		});	

		//Map event
		map.on('draw:created', function(e) {
			var type = e.layerType;
			var layer = e.layer;
			if (type === 'marker') {
				var ll = layer.getLatLng();
				var cpId = mkManager.addMapMarker(layer);
				updateMapControlPointInTable(cpTable, cpId, ll.lng, ll.lat);
				projectImageBoundaries(cpManager, imgModelScaled, mkManager.getMapAreaCoords(), map);	
			}
		});

		//Map event
		mapImage.on('draw:deleted', function(e) {
			var layers = e.layers.getLayers();
			for(var i = 0; i < layers.length; i++){
				var layer = layers[i];
				if(layer instanceof L.Marker){
					cpid = layer._popup._content;
					mkManager.removeImageMarker(cpid);
					updateImageControlPointInTable(cpTable, cpid, "-", "-");
					projectImageBoundaries(cpManager, imgModelScaled, mkManager.getMapAreaCoords(), map);
				}else if(layer instanceof L.Polygon){
					projectImageBoundaries(cpManager, imgModelScaled, mkManager.getMapAreaCoords(), map);
				}
			}
			updateMetadata();
		});

		//Map event
		map.on('draw:deleted', function(e) {
			var layers = e.layers.getLayers();
			for(var i = 0; i < layers.length; i++){
				var layer = layers[i];
				if(layer instanceof L.Marker){
					cpid = layer._popup._content;
					mkManager.removeMapMarker(cpid);
					updateMapControlPointInTable(cpTable, cpid, "-", "-");
					projectImageBoundaries(cpManager, imgModelScaled, mkManager.getMapAreaCoords(), map);
				}
			}
		});

	}

	/**
	* Creates a transformation from the control points in the CP Manager object
	* @param {ControlPointManager} cpManager - A control point manager object.
	* @returns A transformation object (AffineTransformation, SimilarityTransformation) 
	*/
	function createTransformation(cpManager){
		var res;
		var matchCp = cpManager.getMatchedCP();
		var n = matchCp[0].length;
		if(n > 2){
			if(n == 2){
				res = new SimilarityTransformation(matchCp[1], matchCp[2]);
			}else if(n > 2){ //&& n < 6){
				res = new AffineTransformation(matchCp[1], matchCp[2]);
			//}else if(n > 5){
				//TODO: Create polynomial trasformation
				//Polynomial transformations are unstable under big geometric differences in maps
				//Besides, WKT encoding of curve lines can be complicated
			}
		}
		return res;
	}
	
	/**
	* Returns the limits of the image in map coordinates
	* @param trans - A transformation object.
	* @param {ScaledImage} imgModelScaled - Scaled image model.
	* @returns An array of arrays [x,y]
	*/
	function getImageBoundariesInMapCoords(trans, imgModelScaled){
		var imgBnd = new Array();
		//Gets image coords
		imgBnd.push(imgModelScaled.getImageModel().getCartesianLowerLeft_Image1Q());
		imgBnd.push(imgModelScaled.getImageModel().getCartesianUpperLeft_Image1Q());
		imgBnd.push(imgModelScaled.getImageModel().getCartesianUpperRight_Image1Q());
		imgBnd.push(imgModelScaled.getImageModel().getCartesianLowerRight_Image1Q());
		//Projects coords
		var xyProjArrayBnd = trans.transform(imgBnd);
		return xyProjArrayBnd;
	}
	
	/**
	* Draws the image boundaries and map area on the map.
	* @param {ControlPointManager} cpManager - A control point manager object.
	* @param {ScaledImage} imgModelScaled - Scaled image model.
	* @param mapAreaLatLonArray - An array of Leaflet LatLng objects on scaled image's coordinates
	* @param {L.Map} map - The map where the boundaries are going to be drawn.
	*/
	function projectImageBoundaries(cpManager, imgModelScaled, mapAreaLatLonArray, map){
		trans = createTransformation(cpManager);
		mapAreawkt = "";
		var c = Constants.getInstance();
		if(trans != null){
			var mapAreaBnd = new Array();
			var xyProjArrayBnd = getImageBoundariesInMapCoords(trans, imgModelScaled);
			//Gets rid of old boundaries
			if(imageBoundaryOnMap != null){
				map.removeLayer(imageBoundaryOnMap);
			}
			if(imageMapAreaOnMap != null){
				map.removeLayer(imageMapAreaOnMap);
			}
			//Draws the image boundaries
			imageBoundaryOnMap = L.polygon(xySwap(xyProjArrayBnd), c.getConstant("IMAGE_BOUNDARY_POLYGON")).addTo(map);
			var xyProjmapAreaBnd = getBoundary(xyProjArrayBnd);
			//Draws the map area
			if(mapAreaLatLonArray != null){
				//Gets an XY number array from L.Latlng objects
				mapAreaBnd = latlon2xyArray(mapAreaLatLonArray);
				//Scale the coords from scaled image to image
				var unScaledMapAreaBnd = imgModelScaled.unScaleCoordsArray(mapAreaBnd);
				//imageMapArea = calculatePolygonArea(unScaledMapAreaBnd);//No longer required
				//Transform the coords from image refsys to map refsys
				var xyProjmapAreaBnd = trans.transform(unScaledMapAreaBnd);
				mapAreawkt = xyArray2wktPolygon(xyProjmapAreaBnd, c.getConstant("SPATIAL_REFERENCE_SYSTEM"));
				//mapAreaArea = calculatePolygonArea(xyProject(xyProjmapAreaBnd, L.Projection.SphericalMercator));//Leaflet transformation problem http://leafletjs.com/reference.html#icrs
				$("#mapAreaDetails").html("");
				mapAreaVertexTable.fnClearTable();
				mapAreaVertexTable.fnAddData(xyProjmapAreaBnd);
				//$("#mapAreaDetails").append(roundNumber(mapAreaArea/1000000,1) + "squared kilometers");
				imageMapAreaOnMap = L.polygon(xySwap(xyProjmapAreaBnd), c.getConstant("MAP_AREA_POLYGON")).addTo(map);
			}
		}else{
			if(imageBoundaryOnMap != null){
				map.removeLayer(imageBoundaryOnMap);
			}
			if(imageMapAreaOnMap != null){
				map.removeLayer(imageMapAreaOnMap);
			}
		}
	}
	
	/**
	* Prints calculation derived from the ruler drawn by the user
	* @param {L.LatLng} rulerCoords - Array of LatLng objects representing the ruler's vertexs
	* @param {ScaledImage} imgModelScaled - Scaled image model.
	*/
	function printRulerProperties(rulerCoords, imgModelScaled){
		$("#rulerDetails").html("");
		paperMapSize = "";
		paperMapScale = "";
		if(rulerCoords != null && imgModelScaled != null && trans != null){
			//Gets an XY number array from L.Latlng objects
			var xyScaledRuler = latlon2xyArray(rulerCoords);
			//Scale the coords from scaled image to image
			var imgRuler = imgModelScaled.unScaleCoordsArray(xyScaledRuler);
			//Transform the coords from image refsys to map refsys
			var mapRuler = trans.transform(imgRuler);
			//Distance estimation
			var imageDistance = pointArrayDistance(xyArray2point(imgRuler));//Pixels
			var mapDistance = latLngArrayDistance(xyArray2latlon(mapRuler));//Meters
			//Scales
			var factor = 100;//var measurement = 1 / factor;//1 cm
			var mapScaleFactor = mapDistance * factor;
			
			var paperW = imgModelScaled.getImageModel().getWidth() / imageDistance;
			var paperH = imgModelScaled.getImageModel().getHeight() / imageDistance;
			

			paperW = paperW + 38;
			paperH = paperH + 28;

			paperMapSize = roundNumber(paperW,1) + " x " + roundNumber(paperH,1) + " cm";//74 * 95 cm
			paperMapScale = "1:" + roundNumber(mapScaleFactor,1);

			console.log(roundNumber(paperW,1) + " x " + roundNumber(paperH,1) + " cm");//74 * 95 cm);

			$("#rulerDetails").html("<b><i>Ruler distance (1 cm):</i></b><br>");
			$("#rulerDetails").append(roundNumber(imageDistance,1) + " pixels (approximated)<br>");
			$("#rulerDetails").append(roundNumber(mapDistance,1) + " meters (approx)<br><br>");
			$("#rulerDetails").append("<b><i>Map scale:</b></i>: " + paperMapScale + " (approx)<br>");
			$("#rulerDetails").append("<b><i>Paper map size:</b></i> " + paperMapSize + " (approx)<br>");
		}
	}
	
	
	/**
	* Retrieves Dbpedia entries related in space and time
	* @param xybbox - Array of [x,y] with the map area's vertexs.
	* @param {inetger} yearStart - Start year to search.
	* @param {inetger} yearEnd - End year to search.
	* @returns Array of arrays [url, label, abstract]
	*/
	function queryDbpediaST(xybbox, yearStart, yearEnd){
		var res = new Array();
		
		var abstractLength = c.getConstant("ABSTRACT_LENGTH");
		var sq = new SparqlQuery();
		var query = c.getConstant("PREFIXES") + " " + c.getConstant("QUERY_BOX_YEAR");
		
		var xMin = xybbox[0];
		var yMin = xybbox[1];
		var xMax = xybbox[2];
		var yMax = xybbox[3];
		query = query.replace("<PARAM_XMIN>", xMin);
		query = query.replace("<PARAM_YMIN>", yMin);
		query = query.replace("<PARAM_XMAX>", xMax);
		query = query.replace("<PARAM_YMAX>", yMax);
		query = replaceAll("<PARAM_YEAR_START>", yearStart, query);
		query = replaceAll("<PARAM_YEAR_END>", yearEnd, query);
		
		try{
			//Fails when DBpedia is offline - You don't say!
			console.log("queryDbpediaST -> "+query);
			var js = sq.sendSparqlQuery(query, c.getConstant("DBPEDIA_SPARQL"), "");
			if(js.results.bindings.length < 1){
				alert("No spatio-temporal related  results were found!");
			}
			for(var i = 0; i < js.results.bindings.length; i++){
				var subject = js.results.bindings[i].subject.value;
				var label = js.results.bindings[i].label.value;
				var abst = js.results.bindings[i].abst.value;
				abst = abst.substring(0, abstractLength) + "...";
				var tmpArray = new Array(subject, label, abst);
				res.push(tmpArray);
			}
		}catch(err){
			console.log(err); 
		}
		return res;
	}
	
	
	/**
	* Prints suggested Points of Interest taken from DBPedia . Purely spatial.
	* @param xybbox - Array of [x,y] with the map area's vertexs.
	*/
	function queryDbpedia(xybbox){
		var sq = new SparqlQuery();
		var query = c.getConstant("PREFIXES") + " " + c.getConstant("QUERY_CITYS");

		var xMin = xybbox[0];
		var yMin = xybbox[1];
		var xMax = xybbox[2];
		var yMax = xybbox[3];
		query = query.replace("<PARAM_XMIN>", xMin);
		query = query.replace("<PARAM_YMIN>", yMin);
		query = query.replace("<PARAM_XMAX>", xMax);
		query = query.replace("<PARAM_YMAX>", yMax);
		try{
			//Fails when DBpedia is offline
			var js = sq.sendSparqlQuery(query, c.getConstant("DBPEDIA_SPARQL"), "");
			$("#suggestedControlPointsTableDiv").html("");
			$("#suggestedControlPointsTableDiv").append("<b><i>POI Suggestions: </i></b>");
			paperMapPlaces = "";
			if(js.results.bindings.length < 1){
				alert("No POIs were found in this zone!");
			}
			for(var i = 0; i < js.results.bindings.length; i++){
				var lng = js.results.bindings[i].lg.value;
				var lat = js.results.bindings[i].lt.value;
				$("#suggestedControlPointsTableDiv").append('<a href="javascript: void(0)" onclick="zoomToSuggestion(&quot;' + lng + '&quot; , &quot;' + lat + '&quot;)">' + js.results.bindings[i].label.value + "</a>");
				$("#suggestedControlPointsTableDiv").append(", ");
				paperMapPlaces = (paperMapPlaces != "") ? paperMapPlaces + " , " + js.results.bindings[i].label.value : paperMapPlaces;
			}
		}catch(err){
			console.log(err); 
		}
	}
	
	/**
	* Updates the metadata form with some data derived from the georeferenciation.
	*/
	function updateMetadata(){
		$("#paperMapSize").val(paperMapSize);
		$("#paperMapScale").val(paperMapScale);
		$("#paperMapPlaces").val(paperMapPlaces);
		$("#mapAreawkt").val(mapAreawkt);
		//document.getElementById("img_ok_geometry").src="http://png.findicons.com/files/icons/2015/24x24_free_application/24/yes.png";
	}

	/**
	* Validates the data in the metadata tab.
	*/
	function validateMetadata(){
		var res = true;
		var md = MapDescription.getInstance();

		md.setMapUri($("#paperMapUri").val());
		md.setMapCreator($.trim($("#paperMapCreator").val()));
		md.setMapSize($.trim($("#paperMapSize").val()));
		md.setMapTitle($.trim($("#paperMapTitle").val()));
		md.setMapTime($.trim($("#paperMapTime").val()));
		if(imgModelOriginal != null){
			md.setImageUrl(imgModelOriginal.getUrl());
		}
		md.setMapScale($.trim($("#paperMapScale").val()));
		md.setMapPlaces($.trim($("#paperMapPlaces").val()));
		md.setMapArea($.trim($("#mapAreawkt").val()));
		var messages = md.validate();
		var emessage = [];
		var wmessage = [];
		if (messages.length > 0 ){
			for (var i = 0; i < messages.length; i++) {
				var m = messages[i];
				if(m[0] == "ERROR"){
					emessage.push(m[1]);
				}else if(m[0] == "WARNING"){
					wmessage.push(m[1]);
				}
			}
			if(emessage.length > 0){
				alert("ERRORS: " + emessage.join(" "));
				res = false;
			}
			if(wmessage.length > 0){
				alert("WARNINGS: " + wmessage.join(" "));
			}
		}
		return res;
	}

	
	/**
	* Build the triples to be sent to the triple store
	*/
	function buildTriples(graph){
		//*****************************************************
		//TODO: Update code to use the methods in MapDescription
		//*****************************************************
		var md  = MapDescription.getInstance();
		var res = md.buildTriples();
		return res;
	}


	
	//------------------------------------------
	//DataTables http://www.datatables.net
	//------------------------------------------

	/**
	* Updates the table with data from a map control point.
	* @param cpTable - Table for displaying control point data.
	* @param {string} cpId - Control point's identifier.
	* @param {double} xMap - Control point's x coord in the map.
	* @param {double} yMap - Control point's y coord in the map.
	*/
	function updateMapControlPointInTable(cpTable, cpId, xMap, yMap){
		if(cpId != null && cpTable != null){
			var rowIndex = getRowIndexFromTable(cpTable, cpId);
			if(rowIndex != null){
				cpTable.fnUpdate(xMap, rowIndex, 3);
				cpTable.fnUpdate(yMap, rowIndex, 4);
			}else{
				var tmp = [cpId, "-", "-", xMap, yMap];
				cpTable.fnAddData(tmp);
			}
		}
	}
	
	/**
	* Updates the table with data from a image control point.
	* @param cpTable - Table for displaying control point data.
	* @param {string} cpId - Control point's identifier.
	* @param {double} xImg - Control point's x coord in the image.
	* @param {double} yImg - Control point's y coord in the image.
	*/
	function updateImageControlPointInTable(cpTable, cpId, xImg, yImg){
		if(cpId != null && cpTable != null){
			var rowIndex = getRowIndexFromTable(cpTable, cpId);
			if(rowIndex != null){
				cpTable.fnUpdate(xImg, rowIndex, 1);
				cpTable.fnUpdate(yImg, rowIndex, 2);
			}else{
				var tmp = [cpId, xImg, yImg, "-", "-"];
				cpTable.fnAddData(tmp);
			}
		}
	}

	
	/**
	* Returns the index and the row values from the table for a given control point
	* @param cpTable - Table displaying control point data.
	* @param {string} cpId - Control point's identifier.
	* @returns An array [index, {rowValue1, rowValue2,...}]
	*/
	function getRowFromTable(cpTable, cpId){//, xImg, yImg){
		var res = new Array();
		var data = cpTable.fnGetData();
		var tmp = new Array();
		for(var i = 0; i < data.length; i++){
			tmp = data[i];
			var id = tmp[0];
			if(id == cpId){
				res.push(i);
				res.push(tmp);
				return res;
			}
		}
	}
	
	/**
	* Returns the index of the row in the table (aoData array index)
	* @param cpTable - Table displaying control point data.
	* @param {string} cpId - Control point's identifier.
	* @returns An integer indicating the position of the control point in the table's array.
	*/
	function getRowIndexFromTable(cpTable, cpId){
		var res;
		var data = cpTable.fnGetData();
		for(var i = 0; i < data.length; i++){
			var tmp = data[i];
			var id = tmp[0];
			if(id == cpId){
				res = i;
				break;
			}
		}
		return res;
	}
	
	
    //Add a click handler to the rows - this could be used as a callback 
    $("#controlPointsTableDiv").on('click', '#controlPointsTable tbody tr', function( e ) {
        if ( $(this).hasClass('row_selected') ) {
            $(this).removeClass('row_selected');
			mkManager.selectMarker("");
        }else {
            cpTable.$('tr.row_selected').removeClass('row_selected');
            $(this).addClass('row_selected');
			var cpId = cpTable.$('tr.row_selected')[0].children[0].innerHTML;
			mkManager.selectMarker(cpId);
        }
    });

	
	
	

	//------------------------------------------
	//jQuery UI http://jqueryui.com/
	//------------------------------------------

	//Accordion
	$(function() {
		$( "#accordion" ).accordion({
		heightStyle: "fill"
		});
	});
	$(function() {
		$( "#accordion-resizer" ).resizable({
		minHeight: 140,
		minWidth: 200,
		resize: function() {
		$( "#accordion" ).accordion( "refresh" );
		}
		});
	});

	//Tabs
	$(function(){
		$( "#tabs" ).tabs();
		// fix the classes
		$( ".tabs-bottom .ui-tabs-nav, .tabs-bottom .ui-tabs-nav > *" )
		.removeClass( "ui-corner-all ui-corner-top" )
		.addClass( "ui-corner-bottom" );
		// move the nav to the bottom
		$( ".tabs-bottom .ui-tabs-nav" ).appendTo( ".tabs-bottom" );
	});

	//Button - Searchs for exiting maps in a triple store using the MAP URI
	$(function(){
		$( "#btSearchMapUri" ).click(function(){
			queryTripleStoreForMaps();
		});
	});
	
	//Searchs for exiting maps in a triple store using the MAP URI
	function queryTripleStoreForMaps(){
		var mapUri = $.trim($("#paperMapUri").val());
		var id = mapUri.substring(mapUri.lastIndexOf("/") + 1);
		$.ajax({
			url: "http://lobid.org/resource",
			dataType : "jsonp",
			data : {
				name : id,
				format : "full"
			},
		}).then(function(data) {
			graph = data[1]["@graph"];
			for (var i = 0; i < graph.length; i++) {
				myObj =  graph[i];
				if(myObj["@id"] == mapUri){
					$( "#paperMapTitle" ).val(myObj.title);
					$( "#paperMapCreator" ).val(myObj.contributor);
				}
			}
			if(graph.length == 0){
				alert("No results found");
			}
		});		
	}
	
	//Button - store. Gets the data, creates a new graph, builds triples and send them to the triple store
	$(function(){
		$( "#btStoreTriples" ).click(function(){
			
			paperMapUri = $("#paperMapUri").val();
			var graph = createGraphName(c.getConstant("HOME_URI"), paperMapUri);

			var imageMapUri;
			
			if(imgModelOriginal != null){
				imageMapUri = imgModelOriginal.getUrl()
			}
			
			if(isUrlOfImage(imageMapUri)){
			
				if(isUrlValid(paperMapUri)){
					

					try{

						if(validateMetadata()){

							var queryInsert = buildTriples(graph);
							console.log(queryInsert);

			 			    $.ajax({
				                type:       "post",
				                url:        "http://giv-lodum.uni-muenster.de:8081/parliament/sparql",
				                data:       {action:'add', update:queryInsert}});
			 			    
		 			    }

						

						//var sq = new SparqlQuery();
						//var js = sq.sendSparqlUpdate(queryCreate, c.getConstant("HOME_SPARQLENDPOINT"), graph);
						//Insert the triples in the new GRAPH
						//sq = new SparqlQuery();
						//var js = sq.sendSparqlUpdate(queryInsert, c.getConstant("HOME_SPARQLENDPOINT"), graph);



						alert("Map data inserted!");
					}catch(err){
						alert(err);
						console.log(err); 
					}
				}else{
					alert("The map URI is invalid. Please review it in the Map Metadata tab.");
				}
			}else{
				alert("The image URL is invalid. Please review it in the image tab.");
			}
		});
	});

	//Button - Get KML. Opens a new window with KML code for displaying the image on Google Earth.
	$(function(){
		$( "#btGenerateKml" ).click(function(){
			trans = createTransformation(cpManager);
			if(trans != null && imgModelScaled != null){
				var imgUrl = imgModelScaled.getImageModel().getUrl();
				var xyProjArrayBnd = getImageBoundariesInMapCoords(trans, imgModelScaled);
				var xyProjmapAreaBnd = getBoundary(xyProjArrayBnd);
				
				var west = xyProjmapAreaBnd[0];
				var south = xyProjmapAreaBnd[1];
				var east = xyProjmapAreaBnd[2];
				var north = xyProjmapAreaBnd[3];
				var rotation = calculateRotation(xyProjArrayBnd);
				
				var kml = getOverlayText(imgUrl, north, south, east, west, rotation);
				var wincode = c.getConstant("CODE_WINDOW_HTML_PREFIX");
				wincode = wincode.replace("<PARAM_WINDOW_TITLE>", "Georeferencer - KML");
				wincode += kml + c.getConstant("CODE_WINDOW_HTML_SUFIX");
				var win = window.open(c.getConstant("CODE_WINDOW_PROPERTIES"));
				win.document.write(wincode);
				win.document.close(); 
			}else{
				alert("Please add at least 3 control points to continue.");
			}
			
		});
	});

	//Button - Get RDF. Opens a new window with RDF.
	$(function(){
		$( "#btGenerateRdf" ).click(function(){
			if(validateMetadata()){
				paperMapUri = $("#paperMapUri").val();
				var imageMapUri = imgModelOriginal.getUrl()

				var c = Constants.getInstance();	
				var graph = createGraphName(c.getConstant("HOME_URI"), paperMapUri);
				var queryInsert = buildTriples(graph);
				var win = window.open(c.getConstant("CODE_WINDOW_PROPERTIES"));
				var wincode = c.getConstant("CODE_WINDOW_HTML_PREFIX");
				wincode = wincode.replace("<PARAM_WINDOW_TITLE>", "Georeferencer - RDF");
				wincode += queryInsert + c.getConstant("CODE_WINDOW_HTML_SUFIX");
				win.document.write(wincode);
				win.document.write(queryInsert);
				win.document.close(); 
			}
		});
	});
	
	//Button - Updates the suggested points of interest
	$(function(){
		$( "#btSuggestPois" ).click(function(){
			if(trans != null && imgModelScaled !== null){
				var xyProjArrayBnd = getImageBoundariesInMapCoords(trans, imgModelScaled);
				var xyProjmapAreaBnd = getBoundary(xyProjArrayBnd);
				$("body").css("cursor", "progress");
				queryDbpedia(xyProjmapAreaBnd);
				$("body").css("cursor", "default");
			}
		});
	});	
	
	
	//Button - load image. Loads the image to the map
	$(function(){
		$( "#btLoadImage" ).click(function(){
			var imageUrl = $( "#imgMapInput" ).val();
			
			if(isUrlOfImage(imageUrl)){
				var image = new Image();
				image.onload = function(){
					//Loads the new image to the map
					imgModelOriginal = new ImageModel(imageUrl, this.width, this.height);
					imgModelScaled = new ScaledImage(imgModelOriginal, imageMapMaxSize);
					var scaleBounds = new Array();
					scaleBounds[0] = imgModelScaled.getScaledImage().getCartesianLowerLeft_Image1Q().reverse();
					scaleBounds[1] = imgModelScaled.getScaledImage().getCartesianUpperRight_Image1Q().reverse();

					if(imageMapLayer != null){
						mapImage.removeLayer(imageMapLayer);//Removes the last loaded image
					}
					imageMapLayer = new L.imageOverlay(imageUrl, scaleBounds);
					imageMapLayer.addTo(mapImage);
					mapImage.setView([imgModelScaled.getScaledImage().getHeight()/2, imgModelScaled.getScaledImage().getWidth()/2], 5);//Zoom to image center
				}
				image.src = imageUrl;
				var md = MapDescription.getInstance();
				md.setImageUrl(imageUrl);

			}else{
				alert("Invalid URL!");
			}
		});
	});
	

//xxxxxxxxxxxxxxxxx

	$(function(){
		$( "#btOAI" ).click(function(){
			//var oaiURL = "http://sammlungen.ulb.uni-muenster.de/oai/?verb=GetRecord&metadataPrefix=mets&identifier="+$( "#oaiInput" ).val();
			var oaiURL = $( "#oaiBaseURI" ).val()+$( "#oaiInput" ).val();
			console.log("Image URL: " + oaiURL);

		    $.get(oaiURL, {}, function(xml) {

				    var images = $("mets\\:fileGrp", xml);

				    for (i = 0; i < images.length; i++) {
				 
						if($(images[i]).attr("USE")=="MAX"){
							var map=$($(images[i]).find("mets\\:file").find("mets\\:FLocat"));
					               	var image_front = $(map[0]).attr("xlink:href");
					               	var image_back = $(map[1]).attr("xlink:href");
						}

				    }
					
				    console.log("Map (Front): " + image_front);
				    console.log("Map (Back): " + image_back);

				    $( "#imgMapInput" ).val(image_front);

				    //console.log("Image URL: "+$( "#imgMapInput" ).val());
				    presentation="";
				    presentation = $("dv\\:presentation", xml).text();
    				console.log("Presentation: " + presentation);

				    var title = $("mods\\:title", xml).text();
				    console.log("Title: " + title);
				    $( "#paperMapTitle" ).val(title);


				    var subtitle = $("mods\\:subTitle", xml).text();
				    console.log("Subtitle: " + subtitle);
					
				    var identifier = $("mods\\:identifier", xml);
				    for (i = 0; i < identifier.length; i++) {	

						if($(identifier[i]).attr("type")=="hbz-idn"){
						
							console.log("Identifier: http://lobid.org/resource/"+identifier[i].textContent);
							$("#paperMapUri").val("http://lobid.org/resource/"+identifier[i].textContent);

				        }

				    }
				    //1617753

				    var creator = $("mods\\:name", xml);
				    var creatorString ="";
				    for (i = 0; i < creator.length; i++) {

				       console.log("Author: "+$(creator[i]).attr("valueURI"));
				       if(creatorString == ""){
				       		creatorString = $(creator[i]).attr("valueURI");
				       } else {
				       		creatorString = creatorString + "," + $(creator[i]).attr("valueURI");
				       }
				    }

				    $( "#paperMapCreator" ).val(creatorString);

				    var places = $("mods\\:subject", xml);	
				    var res = new Array();
				    $("#subjectTags").empty();

				    for (i = 0; i < places.length; i++) {
				       if (typeof $(places[i]).find("mods\\:geographic").attr("valueURI") !== "undefined") {
				          console.log("Place URI (Geographic): "+$(places[i]).find("mods\\:geographic").attr("valueURI"));
				          console.log("Place Name (Geographic): "+$(places[i]).find("mods\\:geographic").text());

				          var entryURI = $(places[i]).find("mods\\:geographic").attr("valueURI");
				          var entryName = $(places[i]).find("mods\\:geographic").text();
				          $("#subjectTags").append("<p id='pSuggestedSubjectTag" + i +"'><input type='checkbox' id='chkPlaceGeo" + i + "' value='" + encodeURI(entryName) + "' class='chSubjectSuggestion' >" + entryName + " - <a href='" + entryURI + "' target='_blank'>view</a> </p>");
				          $('#chkPlaceGeo'+i).prop('checked', true);
				          $('#chkPlaceGeo'+i).prop('disabled', true);

				          res.push(entryURI);

				       }
				    }


					var md = MapDescription.getInstance();
					md.setMapLinksSubjects(res);
				









				    var places2 = $("mods\\:subject", xml);	
				    for (i = 0; i < places2.length; i++) {

				       if (typeof $(places2[i]).attr("valueURI") !== "undefined") {
				          console.log("Place (hierarchicalGeographic): "+$(places2[i]).attr("valueURI"));

		    		      var entryURI = $(places2[i]).attr("valueURI");
				          var entryName = $(places2[i]).text();

						  console.log("Place URI (hierarchicalGeographic): "+$(places2[i]).text());
						  console.log("Place Name (hierarchicalGeographic): "+$(places2[i]).attr("valueURI"));

						  $("#subjectTags").append("<p id='pSuggestedSubjectTag" + i +"'><input type='checkbox' id='chkPlace" + i + "' value='" + encodeURI(entryName) + "' class='chSubjectSuggestion' >" + entryName + " - <a href='" + entryURI + "' target='_blank'>view</a> </p>");
				          $('#chkPlace'+i).prop('checked', true);
				          $('#chkPlace'+i).prop('disabled', true);

				       } 

				    }

				    $( "#btLoadImage" ).click();
				    $( "#btToggleSuggestionTags" ).click();

				    $( "#imgMapInput" ).prop("disabled",true);
				    $( "#paperMapUri" ).prop("disabled",true);		    
				    $( "#paperMapTitle" ).prop("disabled",true);
				    $( "#paperMapCreator" ).prop("disabled",true);
				    $( "#paperMapSubjects" ).prop("disabled",true);		    

				    $( "#btFindSubjectMatches" ).prop("disabled",true);
				    $( "#btLoadImage" ).prop("disabled",true);
				    $( "#btSearchMapUri" ).prop("disabled",true);
					$( "#btToggleSubjectTags" ).prop("disabled",true);
				    

		}, "xml");


		});
	});


//xxxxxxxxxxxxxxxxx


	//Button - Suggest tags (spatio-temporal references)
	$(function(){
		$( "#btUpdateMapLinks" ).click(function(){
			if(trans != null){
				var md = MapDescription.getInstance();
				var ewmessages = md.validate()
				if(countErrorMessages(ewmessages)[0] == 0){
					var c = Constants.getInstance();
					var dateSeparator = c.getConstant("DATE_SEPARATOR");
					var year = $.trim($("#paperMapTime").val());
					if(year != null){
						var xyProjArrayBnd = getImageBoundariesInMapCoords(trans, imgModelScaled);
						var xybboxBnd = getBoundary(xyProjArrayBnd);
						var yearStart = "";
						var yearEnd = "";
						if(year.indexOf(dateSeparator) >= 0){
							var yearStrArray = year.split(dateSeparator);
							yearStart = yearStrArray[0];// + "-01-01T00:00:00+00:00";//TODO: Find a better way to make the year valid
							yearEnd = yearStrArray[1];//HACK: Machete kills!
						}else{
							yearStart = year// + "-01-01T00:00:00+00:00";//TODO: Find a better way to make the year valid
							yearEnd = year;//HACK: Machete kills!
						}
						var stRefs = queryDbpediaST(xybboxBnd, yearStart, yearEnd);
						//Adds check boxes for suggestions
						$("#stSuggestions").empty();
						var tmp = new Array();
						for(var i = 0; i < stRefs.length; i++){
							var ref = stRefs[i];
							var subject = ref[0];
							if(tmp.indexOf(subject) < 0){//Avoid subject repetition
								tmp.push(subject);
								var label = ref[1];
								var abst = ref[2];
								$("#stSuggestions").append("<p id='pStTag" + tmp.length +"'><input type='checkbox' id='" + subject + "' value='" + subject + "' title='" + abst + "' class='chMapLinkSuggestion' >" + label + " - <a href='" + subject + "' target='_blank'>view</a> <a href='javascript: void(0)' onclick='removeElement(&quot;pStTag" + tmp.length + "&quot;)'>remove</a></p>");
							}
						}
						if(stRefs.length == 0){
							alert("No suggestions found");
						}
					}else{
						alert("Please fill the map time field in the metadata tab.");
					}
				}else{
					var em = " ";
					for (var i = 0; i < ewmessages.length; i++){
						var m = ewmessages[i];
						if(m[0] == "ERROR"){
							em = em + " " + m[1];
						}
						alert("ERRORS:" + em);
					}
				}
			}
		});
	});


	//Button - Find matches to subjects typed by the user
	$(function(){
		$('#btFindSubjectMatches').click(function() {
			queryLobidSubject();
		});
	});		
	
	
	
	
	//Button - Find matches to places typed by the user
	$(function(){
		$('#btFindPlaceMatches').click(function() {
			var md = MapDescription.getInstance();
			var ewmessages = md.validate();
			if(countErrorMessages(ewmessages)[0] == 0){
				queryDbpediaSuggestedPlaces();
			}else{
				var em = " ";
				for (var i = 0; i < ewmessages.length; i++){
					var m = ewmessages[i];
					if(m[0] == "ERROR"){
						em = em + " " + m[1];
					}
					alert("ERRORS:" + em);
				}
			}
		});
	});		
		
		
	//Button - btFindDescriptionMatches Find dbpedia matches to the description typed by the user
	$(function(){
		$( "#btFindDescriptionMatches" ).click(function(){
			queryDbpediaDescription();
		});
	});

	//Button - btToggleContentTags - Toggles checkboxes on/off
	$(function(){
		$( "#btToggleContentTags" ).click(function(){
			//$(".chOntologyContent").attr('checked','checked');
			//$(".chOntologyContent").removeAttr('checked');
			var checkBoxes = $(".chOntologyContent")
			checkBoxes.prop("checked", !checkBoxes.prop("checked"));
		});
	});

	//Button - btToggleSuggestionTags - Toggles checkboxes on/off
	$(function(){
		$( "#btToggleSuggestionTags" ).click(function(){
			var checkBoxes = $(".chMapLinkSuggestion")
			checkBoxes.prop("checked", !checkBoxes.prop("checked"));
		});
	});

	//Button - btTogglePlaceTags - Toggles checkboxes on/off
	$(function(){
		$( "#btTogglePlaceTags" ).click(function(){
			var checkBoxes = $(".chPlaceSuggestion")
			checkBoxes.prop("checked", !checkBoxes.prop("checked"));
		});
	});

	//Button - btToggleDescriptionTags - Toggles checkboxes on/off
	$(function(){
		$( "#btToggleDescriptionTags" ).click(function(){
			var checkBoxes = $(".chDescriptionSuggestion")
			checkBoxes.prop("checked", !checkBoxes.prop("checked"));
		});
	});	
	

	/**
	* Metadata tab events
	*/
	$("#paperMapUri").change(function(){
		var md = MapDescription.getInstance();
		md.setMapUri($.trim($("#paperMapUri").val()));
	});
	$("#paperMapTitle").change(function(){
		var md = MapDescription.getInstance();
		md.setMapTitle(getStringEscaped($.trim($("#paperMapTitle").val())));
	});
	$("#paperMapCreator").change(function(){
		var md = MapDescription.getInstance();
		md.setMapCreator(getStringEscaped($.trim($("#paperMapCreator").val())));
	});
	$("#paperMapSize").change(function(){
		var md = MapDescription.getInstance();
		md.setMapSize($.trim($("#paperMapSize").val()));
	});
	$("#paperMapTime").change(function(){
		var md = MapDescription.getInstance();
		md.setMapTime($.trim($("#paperMapTime").val()));
	});
	$("#paperMapScale").change(function(){
		var md = MapDescription.getInstance();
		md.setMapScale($.trim($("#paperMapScale").val()));
	});
	$("#mapAreawkt").change(function(){
		var md = MapDescription.getInstance();
		md.setMapArea($.trim($("#mapAreawkt").val()));
	});
	$("#taMapDescription").change(function(){
		var md = MapDescription.getInstance();
		md.setMapDescription($.trim($("#taMapDescription").val()));
	});
	
	/**
	* Events of the dynamically created checkboxes
	*/
	$("body").on("change", ".chOntologyContent", function() {
		var res = new Array();
		$(".chOntologyContent").each(function( index ){
			if(this.checked){
				res.push(this.value);
			}
		});
		var md = MapDescription.getInstance();
		md.setMapLinksContents(res);
	});
	$("body").on("change", ".chMapLinkSuggestion", function() {
		var res = new Array();
		$(".chMapLinkSuggestion").each(function( index ){
			if(this.checked){
				res.push(this.value);
			}
		});	
		var md = MapDescription.getInstance();
		md.setMapLinksTags(res);
	});
	$("body").on("change", ".chPlaceSuggestion", function() {
		var res = new Array();
		$(".chPlaceSuggestion").each(function( index ){
			if(this.checked){
				res.push(this.value);
			}
		});	
		var md = MapDescription.getInstance();
		md.setMapLinksPlaces(res);
	});
	$("body").on("change", ".chDescriptionSuggestion", function() {
		var res = new Array();
		$(".chDescriptionSuggestion").each(function( index ){
			if(this.checked){
				res.push(this.value);
			}
		});	
		var md = MapDescription.getInstance();
		md.setMapLinksDescription(res);
	});
	$("body").on("change", ".chSubjectSuggestion", function() {
		var res = new Array();
		$(".chSubjectSuggestion").each(function( index ){
			if(this.checked){
				res.push(this.id);
			}
		});	
		var md = MapDescription.getInstance();
		md.setMapLinksSubjects(res);
	});

	/**
	* Query LOBID for subjects.
	*/
	function queryLobidSubject(){
		paperMapPlaces = $.trim($("#paperMapSubjects").val());
		$.ajax({
			//Uses LOBID
			url: "http://lobid.org/subject",
			dataType : "jsonp",
			data : {
				name : paperMapPlaces,
				format : "full"
			},
			success : function(data) {
				$("#subjectTags").html("");
				var tmp = new Array();
				if(data != null && data.length > 1){
					for(var i = 1; i < data.length; i++){
						var obj = data[i];
						var id = obj["@id"];
						var graph0 = obj["@graph"][0];
						var name = graph0["preferredName"];
						var types = "";
						if(tmp.indexOf(id) < 0){//Avoid duplicated tags
							tmp.push(id);
							for(type in graph0["@type"]){
								types = type.substring(type.lastIndexOf("#") + 1, type.length);
							}
							//Creates the checkboxes					
							$("#subjectTags").append("<p id='pSuggestedSubjectTag" + tmp.length +"'><input type='checkbox' id='" + id + "' value='" + encodeURI(name) + "' class='chSubjectSuggestion' >" + name + " - <a href='" + id + "' target='_blank'>view</a> <a href='javascript: void(0)' onclick='removeElement(&quot;pSuggestedSubjectTag" + tmp.length + "&quot;)'>remove</a></p>");
						}
					}
				}else{
					alert("No matches found");
				}
				
			}
		});
	}
	

	/**
	* Prints suggested places taken from DBPedia. Purely alphanumerical.
	*/
	function queryDbpediaSuggestedPlaces(){
		paperMapPlaces = $.trim($("#paperMapPlaces").val());
		$.ajax({
			//Uses DBpedia spotlight
			url: "http://spotlight.dbpedia.org/rest/annotate?text=" + escape(paperMapPlaces) + "&confidence=0.0&support=00&types=Place",
			headers: { 
				Accept : "application/json; charset=utf-8",
				"Content-Type": "text/plain; charset=utf-8"
			},
			}).done(function ( data ) {
				$("#placeTags").html("");
				var tmp = new Array();
				if(data != null && data.Resources != null){
					for(var i = 0; i < data.Resources.length; i++){
						var obj = data.Resources[i];
						var subject = obj["@URI"];
						if(tmp.indexOf(subject) < 0){//Avoid duplicated tags
							tmp.push(subject);
							//var originalText = obj["@surfaceForm"];
							//Gets the URL last part
							var matchedText = subject.substring(subject.lastIndexOf("/") + 1, subject.length);
							//Creates the checkboxes					
							$("#placeTags").append("<p id='pSuggestedPlaceTag" + tmp.length +"'><input type='checkbox' id='" + subject + "' value='" + subject + "' class='chPlaceSuggestion' >" + matchedText + " - <a href='" + subject + "' target='_blank'>view</a> <a href='javascript: void(0)' onclick='removeElement(&quot;pSuggestedPlaceTag" + tmp.length + "&quot;)'>remove</a></p>");
							//Completes the subject with the label and abstract -getDbpediaLabelAbstract();
						}
					}
				}else{
					alert("No matches found");
				}
			}
		);	
	}


	/**
	* Fills a list of places matching the user search on the map
	*/
	$('#searchMapPlaces').each(function() {
		var $input = $(this);
		$input.autocomplete({
			source : function(request, response) {
				$.ajax({
					url : "http://api.geonames.org/searchJSON",
					dataType : "json",
					data : {
						q : request.term,
						maxRows : "5", 
						fuzzy : "0.8", 
						username: "hamersson", 
						format : "lat"
					},
					success : function(data) {
						//Filter JSON objects
						var myArray1 = new Array();
						var gn = data.geonames;
						for (i = 0;i < gn.length; i++) {
							var tmpObj = {};
							tmpObj.label = gn[i].name + ", " + gn[i].countryName;
							tmpObj.value = gn[i].name + ", " + gn[i].countryName + " (Lon: " + gn[i].lng + "; Lat: " + gn[i].lat + ")";
							myArray1[i] = tmpObj;
						}
						response(myArray1);
					}
				});
			},
			select: function( event, ui ) {
				str = ui.item.value;
				tmp1 = str.substring(str.indexOf(":") + 2 , str.lastIndexOf(")"));
				tmp2 = tmp1.split(";");
				lng = tmp2[0];
				lat = tmp2[1].substring(tmp2[1].indexOf(":") + 1);
				zoomToSuggestion(lng, lat);
			}
		});
	});	


	/**
	* Goes to DBpedia and retrieves the label and abstract for a given subject
	* @param uriSubject Subject's URI.
	* @ returns A string array [uriSubject, label, abstract]
	*/
	function getDbpediaLabelAbstract(uriSubject){
		var res = new Array();
		var query = c.getConstant("PREFIXES") + " " + c.getConstant("QUERY_COMPLETE_SUBJECT");
		var sq = new SparqlQuery();
		var abstractLength = c.getConstant("getConstant");
		
		query = query.replace("<PARAM_URI>", uriSubject);
		try{
			var js = sq.sendSparqlQuery(query, c.getConstant("DBPEDIA_SPARQL"), "");
			if(js.results.bindings.length > 0){
				var label = js.results.bindings[0].label.value;
				var abst = js.results.bindings[0].abst.value;
				//Trims the abstract
				abst = abst.substring(0, abstractLength) + "...";
				res.push(uriSubject);
				res.push(label);
				res.push(abst);
			}else{
				alert("No suggestions were found!");
			}
		}catch(err){
			console.log(err); 
		}
		return res;
	}

	
	/**
	* Prints suggested places taken from DBPedia. Purely alphanumerical.
	*/
	function queryDbpediaDescription(){
		paperMapDescription = $.trim($("#taMapDescription").val());
		$.ajax({
			//Uses DBpedia spotlight
			url: "http://spotlight.dbpedia.org/rest/annotate?text=" + escape(paperMapDescription) + "&confidence=0.0&support=00",
			headers: { 
				Accept : "application/json; charset=utf-8",
				"Content-Type": "text/plain; charset=utf-8"
			},
			}).done(function ( data ) {
				$("#descriptionTags").html("");
				var tmp = new Array();
				if(data.Resources != null){
					for(var i = 0; i < data.Resources.length; i++){
						var obj = data.Resources[i];
						var subject = obj["@URI"];
						if(tmp.indexOf(subject) < 0){//Avoid subject repetition
							tmp.push(subject);
							//var originalText = obj["@surfaceForm"];
							//Gets the URL last part
							var matchedText = subject.substring(subject.lastIndexOf("/") + 1, subject.length);
							//Creates the checkboxes					
							$("#descriptionTags").append("<p id='pDescriptionTag" + tmp.length +"'><input type='checkbox' id='" + subject + "' value='" + subject + "' class='chDescriptionSuggestion' >" + matchedText + " - <a href='" + subject + "' target='_blank'>view</a> <a href='javascript: void(0)' onclick='removeElement(&quot;pDescriptionTag" + tmp.length + "&quot;)'>remove</a></p>");
							//Completes the subject with the label and abstract -getDbpediaLabelAbstract();
						}
					}
				}
			}
		);	

	}


});	





//Returns the selected row in the table. It must be outside of the ready function
function fnGetSelected( oTableLocal ){
    return oTableLocal.$('tr.row_selected');
}