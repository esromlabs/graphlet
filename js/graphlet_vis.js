(function () {
	var g;
	//var nodes_editor = null;
	g_aux = {"name":""};
	var g_template = ""
	var add_edge_mode = false;
	var add_edge_arr = [];

	// convert a stored graph into a from that is appropreate for Cytoscape.js
	load_hbg = function (graph) {
		var raw_nodes = graph.nodes;
		var raw_edges = graph.edges;
		var demoNodes = [];
		var demoEdges = [];
		var i, o, name, id;
		var source, target;
		var id_mode = "provided";
		if (graph && graph.graph && graph.graph.name) {
			g_aux = graph.graph;
			g_template = graph.graph.template;
		}
		for (i = 0; i < raw_nodes.length; i++) {
			o = {data:raw_nodes[i]};
			if (o.data.id === undefined) {
				o.id = "n"+i;
				id_mode = "generated";
			}
			if (o.data.node_type === undefined && o.data.type !== undefined) {
				o.data.node_type = o.data.type;
			}
			demoNodes.push(o);
		}
		for (i = 0; i < raw_edges.length; i++) {
			name = raw_edges[i][3] || "";
			id = "e"+i;
			source = raw_edges[i][0];
			target = raw_edges[i][1];
			if (id_mode === "generated") {
				source = "n"+raw_edges[i][0];
				target = "n"+raw_edges[i][1];
			}
			
			o = {"data":{"id":id, "name": name, "source": source, "target": target, "edge_type": raw_edges[i][2], "guard": raw_edges[i][4], "weight": 20}};
			demoEdges.push(o);
		}
		return { 
		  nodes: demoNodes,
		  edges: demoEdges
		};
	};

	get_current_cyto_graph = function () {
		return g;
	};
	set_nodes_editor = function (ed) {
		nodes_editor = ed;
		// editor feedback to the graph
	};
	set_edges_editor = function (ed) {
		edges_editor = ed;
		// editor feedback to the graph
	};

	load_cy_graph = function (init_graph) {
		if (g) {
			g.remove(g.elements("node"));
		}
		$('#graph_vis').cytoscape({
		elements: init_graph,
		style: cytoscape.stylesheet()
			.selector("node")
				.css({
					"content": "data(name)",
					"font-size": 16,
					"shape": "ellipse",
					"border-width": 3,
					"background-color": "#E9E2D4",
					"border-color": "#B29E7C",
					"text-valign":"center",
					"width": 60
				})
			.selector("node[node_type='io']")
				.css({
					"background-color": "#DDE2FF",
					"border-color": "#8890BB",
					"shape": "roundrectangle",
					"width": 80
				})
			.selector("edge")
				.css({
					"content": "data(name)",
					"font-size": 16,
					"text-outline-color": "#FFF",
					"text-outline-width": 0.4,
					"font-weight": "normal",
					"opacity": 0.65,
					"text-opacity": 1.0,
					"text-outline-opacity": 0.5,
					"color": "#776655",
					"width": "mapData(weight, 0, 100, 1, 4)",
					"source-arrow-shape": "circle",
					"target-arrow-shape": "triangle",
					"line-color": "#4C412F",
				})
			.selector("edge[edge_type='get']")
				.css({
					"line-color": "#1A1",
					"source-arrow-color": "#1A1",
					"target-arrow-color": "#1A1",
					"source-arrow-shape": "diamond",
					"target-arrow-shape": "triangle"
				})
			.selector("edge[edge_type='set']")
				.css({
					"line-color": "#B22",
					"source-arrow-color": "#B22",
					"target-arrow-color": "#B22",
					"source-arrow-shape": "circle",
					"target-arrow-shape": "triangle"
				})
			.selector("edge[edge_type='flo'], edge[edge_type='sub'], edge[edge_type='pub']")
				.css({
					"line-color": "#22C",
					"source-arrow-color": "#22C",
					"target-arrow-color": "#22C",
					"source-arrow-shape": "tee",
					"target-arrow-shape": "triangle"
				})
			.selector(":selected")
				.css({
					"background-color": "#FF0",
					"line-color": "#FF0",
					"width": "mapData(weight, 0, 100, 3, 6)"
				}),
		ready: function(){
			var nodeCount, nodes;
			var i, pos, data;
			g = $("#graph_vis").cytoscape("get");
			nodes = g.nodes();
			nodeCount = nodes.length;
			for (i = 0; i < nodeCount; i++) {
				data = nodes[i].data();
				if (data && data.view && data.view.position) {
					pos = data.view.position;
					//alert(pos.x + " " + pos.y);
					nodes[i].position({x: pos.x, y: pos.y});
				}
			}
			this.on('click', 'node', function(evt) {
			  if (add_edge_mode) {
				if(!add_edge_arr[0]) {
					add_edge_arr[0] = this.data().id;
					//alert("first node" + node.data().id);
				}
				else {
					add_edge_arr[1] = this.data().id;
					//alert("second node" + node.data().id);
					g.add({"edges":[ {"data":{"source":add_edge_arr[0], "target":add_edge_arr[1]}}]});
					add_edge_mode = false;
				}
			  }
			});
			this.on('select', sync_selected);
			//this.on("mouseup", sync_selected);
		  }
		});
	};

	$(function() {
		//var init_graph = load_hbg(graph);
		// jQuery should add this to the API
		// adds options to a select tag from a list.
		$.fn.options = function(l) {
			var html_options = '<option value=""></option>\n';
			$.each(l, function(i, o) {
				html_options += '<option value="'+o+'">' + o + '</option>\n';
			});
			$(this).html(html_options);
		};
		
		//load_cy_graph(init_graph);
		$('#add_node').on("click", function() {
			//alert(g.nodes().length);
			var ns = g.add({"nodes":[ {"data":{"view":{"position":{"x":30,"y":30}}}} ]});
			var d = ns[0].data();
			var pos = d.view.position;
			ns[0].position({x: pos.x, y: pos.y});
		});
		$('#add_edge').on("click", function() {
			// toggle edge mode
			add_edge_mode = !add_edge_mode;
			if (add_edge_mode) {
				add_edge_arr[0] = null;
				add_edge_arr[1] = null;
			}
		});
		$('#delete_node').on("click", function() {
			var eles = g.elements("node:selected");
			g.remove(eles);
		});
		$('#delete_edge').on("click", function() {
			var eles = g.elements("edge:selected");
			g.remove(eles);
		});
		$(".ui_mode").on('click', function (e) {
			var $btn = $(e.target);
			var id = "", fq = "";
			if (!$btn.hasClass('btn')) { $btn = $btn.closest('.btn');}
			id = $btn.attr("id");
			if (id === "edit") {
				$(document).trigger("edit_mode");
			}
			if (id === "run") {
				$(document).trigger("run_mode");
			}
		});
		$(document).on("edit_mode", function (e) {
			$('#edit_mode_ui').show();
			$('#run_mode_ui').hide();
			$('#graph_in').hide();
			$('#graph_out').hide();
		});
		$(document).on("run_mode", function (e) {
			var graph_json_str = export_graph_json(g);
			$('#run_mode_ui').show();
			$('#edit_mode_ui').hide();
			$('#graph_in').hide();
			$('#graph_out').hide();
			
			// set the run env.
			init_graphlet(JSON.parse(graph_json_str));
		});
		$('#node_editor').on("update_form", function(event, nodes_selected) {
			$("#node_input_header>span").text(""+nodes_selected.length);
			nodes_editor.setValue(nodes_selected);
			nodes_editor.on('change',function() {
				update_graph_nodes(nodes_editor.root.value);
			});
		});
		$("#edge_editor").on("update_form", function(event, edges_selected) {
			$("#edge_input_header>span").text(""+edges_selected.length);
			edges_editor.setValue(edges_selected);
			edges_editor.on('change',function() {
				update_graph_edges(edges_editor.root.value);
			});
		});
		$("#view_all").on("click", function() {
			g.fit();
		});
		$("#view_zoom_1").on("click", function() {
			g.zoom({
				level: 1.0,
				renderedPosition: {"x":200, "y":300}
			});
		});
		
	});
	// send node data to the cy graph (visualization)
	function update_graph_nodes(nodes) {
		$.each(nodes, function (i, node) {
			var node_id = node["id"];
			var ele = g.elements("node" + "[id='" + node_id + "']")[0];
			if (ele) {
				ele.data(node);
				ele.position({x: node.view.position.x, y: node.view.position.y});
			}
			else {
				alert(node_id + " no ele");
			}
		});
	}

	// send edge data to the cy graph (visualization)
	function update_graph_edges(edges) {
		$.each(edges, function (i, edge) {
			var edge_id = edge["id"];
			var ele = g.elements("edge" + "[id='" + edge_id + "']")[0];
			if (ele) {
				ele.data(edge);
			}
			else {
				alert(edge_id + " no ele");
			}
		});
	}

	function update_graph_ele(event) {
		var node_id = $(this).data("id");
		var ele = g.elements(event.data.ele_type + "[id='" + node_id + "']")[0];
		if (ele) {
			ele.data(event.data.data_field, $(this).val());
		}
		else {
			alert(node_id + " no ele");
		}
	}
	// pull data from cy and trigger the form update events
	function sync_selected(evt) {
		var nodes_selected = [];
		var edges_selected = [];
		var eles = g.elements("node:selected");
		$(document).trigger("edit_mode");
		$.each(eles, function(i, ele){
			// update the view information (position etc.)
			var node_data = ele.data();
			var pos = ele.renderedPosition();
			if (!node_data.view) {
				node_data.view = {};
			}
			node_data.view.position = pos;
			nodes_selected.push(node_data);
		});
		$('#node_editor').trigger("update_form", [nodes_selected]);
		
		// next handle edges
		eles = g.elements("edge:selected");
		$.each(eles, function(i, ele){
			var edge_data = ele.data();
			edges_selected.push(edge_data);
		});
		$("#edge_editor").trigger("update_form", [edges_selected]);
	}

	export_graph_json = function (g) {
		var nodes = g.nodes();
		var edges = g.edges();
		var exp_graph_json;
		var graph_desc = g.graph || g_aux || {};
		graph_desc.template = g.template || g_template || "<button id='start_button'>Say Hello</button><div class='greeting'></div>";
		exp_graph_json = '{"graph":' + JSON.stringify(graph_desc) + ', "nodes":[';
		
		var o, data, pos, source, target, spacer = "";
		for (i = nodes.length-1; i >= 0; i--) {
			exp_graph_json += spacer + '\n';
			spacer = ',';
			data = nodes[i].data();
			o = data;
			pos = nodes[i].renderedPosition();
			o.view = {};
			o.view.position = {'x':Math.round(pos.x), 'y':Math.round(pos.y)};
			exp_graph_json += "  " + JSON.stringify(o);
		}
		spacer = "";
		exp_graph_json += '\n ],\n "edges":['
		for (i = 0; i < edges.length; i++) {
			exp_graph_json += spacer + '\n';
			spacer = ',';
			data = edges[i].data();
			source = edges[i].source().id();
			target = edges[i].target().id();
			o = [source, target, data.edge_type, data.name, data.guard, parseInt(data.id.substr(1), 10)];
			exp_graph_json += "  " + JSON.stringify(o);
		}
		exp_graph_json += '\n ]\n}';
		return exp_graph_json;
	};

	// Prune to Level is a debugging aid for opjects that 
	// are too deep or cause a circular reference error in JSON.stringify 
	function prune2level(obj, level) {
		var top_obj = {};
		var t;
		for (key in obj) {
			t = typeof obj[key];
			if (t !== "undefined" && t !== "object" && t !== "function") {
				top_obj[key] = obj[key];
			}
			if (level > 1 && t === "object" && obj[key] !== null) {
				top_obj[key] = prune2level(obj[key], level -1);
			}
		}
		return top_obj;
	}

	function reload_graph() {
		var s = export_graph_json(g);
		var g2 = JSON.parse(s);
		alert(s);
		g2 = {"elements": g2};
		g.load(g2);
	}
})();