// graphlet run
// 

(function($, gq) {
    var glt;
    // get all values from get edges and return as an object
    var get_all = function(id) {
        var got_obj = {};
        var g = this.glt;
        var get_edges = gq.using(g).find({"element":"edge", "type":"get", "from":id}).edges();
        $.each(get_edges, function(i, o) {
			var to_node = o[1];
            var end_node = gq.using(g).find({"element":"node", "id":to_node}).nodes()[0];
            var alias = o[3];
            var name = alias || end_node.name;
            got_obj[name] = end_node.data[name];
        });
        return got_obj;
    };
    var set_all = function(id, result) {
		var g = this.glt;
        var set_edges = gq.using(g).find({"element":"edge", "type":"set", "from":id}).edges();
        $.each(set_edges, function(i, o) {
            var end_node = gq.using(g).find({"element":"node", "id":o[1]}).nodes()[0];
            var start_node;
            var alias = o[3];
            var name = alias || end_node.name || "data";
            if (name.charAt(0) === ".") {
				if (end_node.io && end_node.io.selector) {
					start_node = gq.using(g).find({"element":"node", "id":id}).nodes()[0];
					switch (name)  {
						case ".css":
							$(end_node.io.selector).css(start_node.data);
							break;
						case ".attr":
							$(end_node.io.selector).attr(start_node.data);
							break;
						case ".hide":
							$(end_node.io.selector).hide(start_node.data.speed);
							break;
						case ".show":
							$(end_node.io.selector).show(start_node.data.speed);
							break;
						default:
							alert("jQuery function " +name + " is not supported at this time.");
					}
					
				}				
			}
			else {
				if (!end_node.data) { end_node.data = {};}
				end_node.data[name] = result[name];
				if (end_node.io && end_node.io.selector) {
					$(end_node.io.selector).text(end_node.data[name]);
				}
			}
        });
    };
    var transition_to = function(id, get_result) {
		var g = this.glt;
        var trans_edges = gq.using(g).find({"element":"edge", "type":"flo", "from":id}).edges();
        $.each(trans_edges, function(i, e) {
			var guard_expression = e[4];
			var guard = run_edge_guard(get_result, guard_expression);
			if (guard.result) {
				setTimeout(function() {$("body").trigger("edge_" + e[5]);}, 10);
			}
        });
    };
    var run_node = function(target_node) {
		var get_data = get_all(target_node.id);
		//alert(JSON.stringify(target_node.process[0]));
		//alert(JSON.stringify(get_data));
		var result = target_node.data;
		if (target_node.node_type === "process") {
			result = run_node_process(get_data, target_node.process[0]);
		}
		//alert(JSON.stringify(get_data));
		//alert(JSON.stringify(result));
		set_all(target_node.id, result);
		//alert(JSON.stringify(gq.using(this.g).find({"element":"node", "id":"n3"}).nodes()[0]));
		transition_to(target_node.id, result);
	};
	
	// sandbox for functional (saferEval)
	// create our own local versions of window and document with limited functionality
	var run_node_process = function (env, code) {
		// Shadow some sensitive global objects
		var locals = {
			window: {},
			document: {}
		};
		// and mix in the environment
		locals = $.extend(locals, env);

		var createSandbox = function (env, code, locals) {
			var params = []; // the names of local variables
			var args = []; // the local variables

			for (var param in locals) {
				if (locals.hasOwnProperty(param)) {
					args.push(locals[param]);
					params.push(param);
				}
			}

			var context = Array.prototype.concat.call(env, params, code); // create the parameter list for the sandbox
			var sandbox = new (Function.prototype.bind.apply(Function, context)); // create the sandbox function
			context = Array.prototype.concat.call(env, args); // create the argument list for the sandbox

			return Function.prototype.bind.apply(sandbox, context); // bind the local variables to the sandbox
		};

		// result is the 'this' object for the code
		var result = {};
		var sandbox = createSandbox(result, code, locals); // create a sandbox

		sandbox(); // call the user code in the sandbox
		return result;
	};

	var run_edge_guard = function (env, code) {
		// Shadow some sensitive global objects
		var locals = {
			window: {},
			document: {}
		};
		// and mix in the environment
		locals = $.extend(locals, env);

		var createSandbox = function (env, code, locals) {
			var params = []; // the names of local variables
			var args = []; // the local variables

			for (var param in locals) {
				if (locals.hasOwnProperty(param)) {
					args.push(locals[param]);
					params.push(param);
				}
			}

			var context = Array.prototype.concat.call(env, params, "this.result = (" + code + ");"); // create the parameter list for the sandbox
			var sandbox = new (Function.prototype.bind.apply(Function, context)); // create the sandbox function
			context = Array.prototype.concat.call(env, args); // create the argument list for the sandbox

			return Function.prototype.bind.apply(sandbox, context); // bind the local variables to the sandbox
		};

		// result is the 'this' object for the code
		var result = {};
		var sandbox = createSandbox(result, code, locals); // create a sandbox

		sandbox(); // call the user code in the sandbox
		return result;
	};

	

    init_graphlet = function(g) {
        var flo_edges = gq.using(g).find({"element":"edge", "type":"flo"}).edges();
        var io_events = gq.using(g).find({"element":"edge", "type":"evt"}).edges();
        this.glt = g;
        if (g.graph && g.graph.template) {
			$(function() {
				$("#graphlet").html(g.graph.template);
			});
		}
        $.each(flo_edges, function(i, o) {
			$("body").on("edge_" + o[5], function () {
				var to_node_id = o[1];
				var target_node = gq.using(g).find({"element":"node", "id":to_node_id}).nodes()[0];
				run_node(target_node);
			});
		});
        $.each(io_events, function(i, o) {
			var from_node_id = o[0];
			var target_node = gq.using(g).find({"element":"node", "id":from_node_id}).nodes()[0];
			var io = target_node.io;
			$(function(){$(io.selector).on(io.event, function() {
				var to_node_id = o[1];
				var target_node = gq.using(g).find({"element":"node", "id":to_node_id}).nodes()[0];
				run_node(target_node);
			});});
			
		});
    };
        
})($, gq);

