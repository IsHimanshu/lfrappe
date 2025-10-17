// frappe.provide("frappe.views");

// frappe.views.GanttView = class GanttView extends frappe.views.ListView {
// 	get view_name() {
// 		return "Gantt";
// 	}

// 	setup_defaults() {
// 		return super.setup_defaults().then(() => {
// 			this.page_title = this.page_title + " " + __("Gantt");
// 			this.calendar_settings = frappe.views.calendar[this.doctype] || {};

// 			if (typeof this.calendar_settings.gantt == "object") {
// 				Object.assign(this.calendar_settings, this.calendar_settings.gantt);
// 			}

// 			if (this.calendar_settings.order_by) {
// 				this.sort_by = this.calendar_settings.order_by;
// 				this.sort_order = "asc";
// 			} else {
// 				this.sort_by =
// 					this.view_user_settings.sort_by || this.calendar_settings.field_map.start;
// 				this.sort_order = this.view_user_settings.sort_order || "asc";
// 			}
// 		});
// 	}

// 	setup_view() {}

// 	prepare_data(data) {
// 		super.prepare_data(data);
// 		this.prepare_tasks();
// 	}

// 	prepare_tasks() {
// 		var me = this;
// 		var meta = this.meta;
// 		var field_map = this.calendar_settings.field_map;

// 		this.tasks = this.data.map(function (item) {
// 			// set progress
// 			var progress = 0;
// 			if (field_map.progress && $.isFunction(field_map.progress)) {
// 				progress = field_map.progress(item);
// 			} else if (field_map.progress) {
// 				progress = item[field_map.progress];
// 			}

// 			// title
// 			var label;
// 			if (meta.title_field) {
// 				label = item.progress
// 					? __("{0} ({1}) - {2}%", [item[meta.title_field], item.name, item.progress])
// 					: __("{0} ({1})", [item[meta.title_field], item.name]);
// 			} else {
// 				label = item[field_map.title];
// 			}

// 			var r = {
// 				start: item[field_map.start],
// 				end: item[field_map.end],
// 				name: label,
// 				id: item[field_map.id || "name"],
// 				doctype: me.doctype,
// 				progress: progress,
// 				dependencies: item.depends_on_tasks || "",
// 			};

// 			if (item.color && frappe.ui.color.validate_hex(item.color)) {
// 				r["custom_class"] = "color-" + item.color.substr(1);
// 			}

// 			if (item.is_milestone) {
// 				r["custom_class"] = "bar-milestone";
// 			}

// 			return r;
// 		});
// 	}

// 	render() {
// 		this.load_lib.then(() => {
// 			this.render_gantt();
// 		});
// 	}

// 	render_header() {}

// 	render_gantt() {
// 		const me = this;
// 		const gantt_view_mode = this.view_user_settings.gantt_view_mode || "Day";
// 		const field_map = this.calendar_settings.field_map;
// 		const date_format = "YYYY-MM-DD";

// 		this.$result.empty();
// 		this.$result.addClass("gantt-modern");

// 		this.gantt = new Gantt(this.$result[0], this.tasks, {
// 			bar_height: 35,
// 			bar_corner_radius: 4,
// 			resize_handle_width: 8,
// 			resize_handle_height: 28,
// 			resize_handle_corner_radius: 3,
// 			resize_handle_offset: 4,
// 			view_mode: gantt_view_mode,
// 			date_format: "YYYY-MM-DD",
// 			on_click: (task) => {
// 				frappe.set_route("Form", task.doctype, task.id);
// 			},
// 			on_date_change: (task, start, end) => {
// 				if (!me.can_write) return;
// 				frappe.db.set_value(task.doctype, task.id, {
// 					[field_map.start]: moment(start).format(date_format),
// 					[field_map.end]: moment(end).format(date_format),
// 				});
// 			},
// 			on_progress_change: (task, progress) => {
// 				if (!me.can_write) return;
// 				var progress_fieldname = "progress";

// 				if ($.isFunction(field_map.progress)) {
// 					progress_fieldname = null;
// 				} else if (field_map.progress) {
// 					progress_fieldname = field_map.progress;
// 				}

// 				if (progress_fieldname) {
// 					frappe.db.set_value(task.doctype, task.id, {
// 						[progress_fieldname]: parseInt(progress),
// 					});
// 				}
// 			},
// 			on_view_change: (mode) => {
// 				// save view mode
// 				me.save_view_user_settings({
// 					gantt_view_mode: mode,
// 				});
// 			},
// 			custom_popup_html: (task) => {
// 				var item = me.get_item(task.id);

// 				var html = `<div class="title">${task.name}</div>
// 					<div class="subtitle">${moment(task._start).format("MMM D")} - ${moment(task._end).format(
// 					"MMM D"
// 				)}</div>`;

// 				// custom html in doctype settings
// 				var custom = me.settings.gantt_custom_popup_html;
// 				if (custom && $.isFunction(custom)) {
// 					var ganttobj = task;
// 					html = custom(ganttobj, item);
// 				}
// 				return '<div class="details-container">' + html + "</div>";
// 			},
// 		});
// 		this.setup_view_mode_buttons();
// 		this.set_colors();
// 	}

// 	setup_view_mode_buttons() {
// 		// view modes (for translation) __("Day"), __("Week"), __("Month"),
// 		//__("Half Day"), __("Quarter Day")

// 		let $btn_group = this.$paging_area.find(".gantt-view-mode");
// 		if ($btn_group.length > 0) return;

// 		const view_modes = this.gantt.options.view_modes || [];
// 		const active_class = (view_mode) => (this.gantt.view_is(view_mode) ? "btn-info" : "");
// 		const html = `<div class="btn-group gantt-view-mode">
// 				${view_modes
// 					.map(
// 						(value) => `<button type="button"
// 						class="btn btn-default btn-sm btn-view-mode ${active_class(value)}"
// 						data-value="${value}">
// 						${__(value)}
// 					</button>`
// 					)
// 					.join("")}
// 			</div>`;

// 		this.$paging_area.find(".level-left").append(html);

// 		// change view mode asynchronously
// 		const change_view_mode = (value) =>
// 			setTimeout(() => this.gantt.change_view_mode(value), 0);

// 		this.$paging_area.on("click", ".btn-view-mode", (e) => {
// 			const $btn = $(e.currentTarget);
// 			this.$paging_area.find(".btn-view-mode").removeClass("btn-info");
// 			$btn.addClass("btn-info");

// 			const value = $btn.data().value;
// 			change_view_mode(value);
// 		});
// 	}

// 	set_colors() {
// 		const classes = this.tasks
// 			.map((t) => t.custom_class)
// 			.filter((c) => c && c.startsWith("color-"));

// 		let style = classes
// 			.map((c) => {
// 				const class_name = c.replace("#", "");
// 				const bar_color = "#" + c.substr(6);
// 				const progress_color = frappe.ui.color.get_contrast_color(bar_color);
// 				return `
// 				.gantt .bar-wrapper.${class_name} .bar {
// 					fill: ${bar_color};
// 				}
// 				.gantt .bar-wrapper.${class_name} .bar-progress {
// 					fill: ${progress_color};
// 				}
// 			`;
// 			})
// 			.join("");

// 		style = `<style>${style}</style>`;
// 		this.$result.prepend(style);
// 	}

// 	get_item(name) {
// 		return this.data.find((item) => item.name === name);
// 	}

// 	get required_libs() {
// 		return [
// 			// "assets/frappe/node_modules/frappe-gantt/dist/frappe-gantt.css",
// 			// "assets/frappe/node_modules/frappe-gantt/dist/frappe-gantt.min.js",
// 		];
// 	}
// };

import './gantt_view.css';

frappe.provide("frappe.views");

frappe.views.GanttView = class GanttView extends frappe.views.ListView {
	get view_name() {
		return "Gantt";
	}

	setup_defaults() {
		return super.setup_defaults().then(() => {
			 return frappe.require('/assets/frappe/js/frappe/views/gantt/gantt_view.css', 'css')
                .then(() => {
                    console.log('✅ CSS loaded via frappe.require');
                })
                .catch((err) => {
                    console.error('❌ CSS loading failed:', err);
                });
        }).then(() => {
			this.page_title = this.page_title + " " + __("Gantt");
			this.calendar_settings = frappe.views.calendar[this.doctype] || {};

			if (typeof this.calendar_settings.gantt == "object") {
				Object.assign(this.calendar_settings, this.calendar_settings.gantt);
			}

			

			if (this.calendar_settings.order_by) {
				this.sort_by = this.calendar_settings.order_by;
				this.sort_order = "asc";
			} else {
				this.sort_by =
					this.view_user_settings.sort_by || this.calendar_settings.field_map.start;
				this.sort_order = this.view_user_settings.sort_order || "asc";
			}
		});
	}

	setup_view() {}

	prepare_data(data) {
		super.prepare_data(data);
		this.prepare_tasks();
	}

	prepare_tasks() {
		var me = this;
		var meta = this.meta;
		var field_map = this.calendar_settings.field_map;

		let invalid_count = 0;

		this.tasks = this.data
			.map(function (item) {
				// Validate start date
				if (!item[field_map.start]) {
					console.warn(
						`Task ${item.name} skipped - missing start date (${field_map.start})`
					);
					invalid_count++;
					return null;
				}

				// Validate end date
				if (!item[field_map.end]) {
					console.warn(
						`Task ${item.name} skipped - missing end date (${field_map.end})`
					);
					invalid_count++;
					return null;
				}

				// Set progress
				var progress = 0;
				if (field_map.progress && $.isFunction(field_map.progress)) {
					progress = field_map.progress(item);
				} else if (field_map.progress) {
					progress = item[field_map.progress];
				}

				// Build title
				var label;
				if (meta.title_field) {
					label = item.progress
						? __("{0} ({1}) - {2}%", [
								item[meta.title_field],
								item.name,
								item.progress,
						  ])
						: __("{0} ({1})", [item[meta.title_field], item.name]);
				} else {
					label = item[field_map.title];
				}

				// Build task object
				var r = {
					start: item[field_map.start],
					end: item[field_map.end],
					name: label,
					id: item[field_map.id || "name"],
					doctype: me.doctype,
					progress: progress || 0,
					dependencies: item.depends_on_tasks || "",
				};

				// Add color if available
				if (item.color && frappe.ui.color.validate_hex(item.color)) {
					r["custom_class"] = "color-" + item.color.substr(1);
				}

				// Mark milestone
				if (item.is_milestone) {
					r["custom_class"] = "bar-milestone";
				}

				return r;
			})
			.filter((task) => task !== null);

		// Show alert if tasks were skipped
		if (invalid_count > 0) {
			frappe.show_alert(
				{
					message: __(
						"{0} tasks were skipped due to missing dates",
						[invalid_count]
					),
					indicator: "orange",
				},
				5
			);
		}
	}

	render() {
		this.load_lib.then(() => {
			this.render_gantt();
		});
	}

	render_header() {}

	// render_gantt() {
	// 	const me = this;
	// 	const gantt_view_mode = this.view_user_settings.gantt_view_mode || "Day";
	// 	const field_map = this.calendar_settings.field_map;
	// 	const date_format = "YYYY-MM-DD";

	// 	// Clear previous content
	// 	this.$result.empty();
	// 	this.$result.addClass("gantt-modern");

	// 	// Check if there are any valid tasks
	// 	if (!this.tasks || this.tasks.length === 0) {
	// 		this.$result.html(`
	// 			<div class="text-center text-muted" style="padding: 100px;">
	// 				<div class="mb-3">
	// 					<svg class="icon icon-xl" style="width: 80px; height: 80px;">
	// 						<use href="#icon-calendar"></use>
	// 					</svg>
	// 				</div>
	// 				<h4>${__("No Tasks to Display")}</h4>
	// 				<p class="text-muted">${__("All tasks are missing required dates")}</p>
	// 			</div>
	// 		`);
	// 		return;
	// 	}

	// 	// Create gantt wrapper container
	// 	const gantt_wrapper = document.createElement("div");
	// 	gantt_wrapper.className = "gantt-wrapper-container";
	// 	this.$result.append(gantt_wrapper);

	// 	try {
	// 		// Initialize Gantt
	// 		this.gantt = new Gantt(gantt_wrapper, this.tasks, {
	// 			// Visual options
	// 			bar_height: 30,
	// 			bar_corner_radius: 3,
	// 			padding: 18,

	// 			// View options
	// 			view_mode: gantt_view_mode,
	// 			date_format: date_format,

	// 			// Disable built-in controls (we'll add our own in footer)
	// 			view_mode_select: false,
	// 			today_button: false,

	// 			// Enable editing
	// 			readonly: false,
	// 			readonly_dates: false,
	// 			readonly_progress: false,

	// 			// Event handlers
	// 			on_click: (task) => {
	// 				frappe.set_route("Form", task.doctype, task.id);
	// 			},

	// 			on_date_change: (task, start, end) => {
	// 				if (!me.can_write) {
	// 					frappe.show_alert({
	// 						message: __("You don't have permission to edit this task"),
	// 						indicator: "red",
	// 					});
	// 					return;
	// 				}

	// 				frappe.db
	// 					.set_value(task.doctype, task.id, {
	// 						[field_map.start]: moment(start).format(date_format),
	// 						[field_map.end]: moment(end).format(date_format),
	// 					})
	// 					.then(() => {
	// 						frappe.show_alert({
	// 							message: __("Task dates updated"),
	// 							indicator: "green",
	// 						});
	// 					})
	// 					.catch((err) => {
	// 						console.error("Error updating dates:", err);
	// 						frappe.show_alert({
	// 							message: __("Error updating task dates"),
	// 							indicator: "red",
	// 						});
	// 					});
	// 			},

	// 			on_progress_change: (task, progress) => {
	// 				if (!me.can_write) {
	// 					frappe.show_alert({
	// 						message: __("You don't have permission to edit this task"),
	// 						indicator: "red",
	// 					});
	// 					return;
	// 				}

	// 				var progress_fieldname = "progress";

	// 				if ($.isFunction(field_map.progress)) {
	// 					progress_fieldname = null;
	// 				} else if (field_map.progress) {
	// 					progress_fieldname = field_map.progress;
	// 				}

	// 				if (progress_fieldname) {
	// 					frappe.db
	// 						.set_value(task.doctype, task.id, {
	// 							[progress_fieldname]: parseInt(progress),
	// 						})
	// 						.then(() => {
	// 							frappe.show_alert({
	// 								message: __("Progress updated to {0}%", [progress]),
	// 								indicator: "green",
	// 							});
	// 						})
	// 						.catch((err) => {
	// 							console.error("Error updating progress:", err);
	// 							frappe.show_alert({
	// 								message: __("Error updating progress"),
	// 								indicator: "red",
	// 							});
	// 						});
	// 				}
	// 			},

	// 			on_view_change: (mode) => {
	// 				const mode_name = typeof mode === "string" ? mode : mode.name;
	// 				me.save_view_user_settings({
	// 					gantt_view_mode: mode_name,
	// 				});
	// 			},

	// 			// Custom popup
	// 			popup: {
	// 				show_on: "hover",
	// 				html: (task) => {
	// 					var item = me.get_item(task.id);
	// 					var html = `
	// 						<div class="title">${task.name}</div>
	// 						<div class="subtitle">
	// 							${moment(task._start).format("MMM D")} - ${moment(task._end).format("MMM D")}
	// 						</div>
	// 						<div class="details">
	// 							Progress: ${task.progress}%
	// 						</div>
	// 					`;

	// 					// Custom html from doctype settings
	// 					var custom = me.settings.gantt_custom_popup_html;
	// 					if (custom && $.isFunction(custom)) {
	// 						html = custom(task, item);
	// 					}

	// 					return html;
	// 				},
	// 			},
	// 		});

	// 		// // Create footer controls
	// 		// this.create_footer_controls(gantt_wrapper);

	// 		// // Apply custom colors
	// 		// this.set_colors();

	// 		//foooter fix

	// 		// Create a page-level shell that controls layout
	// 		const page_shell = document.createElement("div");
	// 		page_shell.className = "gantt-page-shell gantt-modern";
	// 		this.$result.empty().append(page_shell);

	// 		// Create gantt wrapper inside the shell
	// 		const gantt_wrapper = document.createElement("div");
	// 		gantt_wrapper.className = "gantt-wrapper-container";
	// 		page_shell.appendChild(gantt_wrapper);

	// 		// Initialize Gantt into gantt_wrapper (unchanged)
	// 		this.gantt = new Gantt(gantt_wrapper, this.tasks, { /* ...options... */ });

	// 		// Create footer controls and append to the page shell (not to gantt_wrapper)
	// 		this.create_footer_controls(page_shell);

	// 		// Apply custom colors
	// 		this.set_colors();



	// 		console.log(`Gantt rendered successfully with ${this.tasks.length} tasks`);
	// 	} catch (error) {
	// 		console.error("Error rendering Gantt chart:", error);
	// 		this.$result.html(`
	// 			<div class="text-center text-danger" style="padding: 100px;">
	// 				<div class="mb-3">
	// 					<svg class="icon icon-xl text-danger" style="width: 80px; height: 80px;">
	// 						<use href="#icon-alert-circle"></use>
	// 					</svg>
	// 				</div>
	// 				<h4>${__("Error Rendering Gantt Chart")}</h4>
	// 				<p class="text-muted">${error.message}</p>
	// 				<pre class="text-left small text-muted" style="max-width: 600px; margin: 20px auto;">
	// 					${error.stack || ""}
	// 				</pre>
	// 				<button class="btn btn-secondary btn-sm" onclick="location.reload()">
	// 					${__("Reload Page")}
	// 				</button>
	// 			</div>
	// 		`);
	// 	}
	// }
	render_gantt() {
  const me = this;
  const gantt_view_mode = this.view_user_settings.gantt_view_mode || "Day";
  const field_map = this.calendar_settings.field_map;
  const date_format = "YYYY-MM-DD";

  // Clear previous content
  this.$result.empty();
  this.$result.addClass("gantt-modern");

  if (!this.tasks || this.tasks.length === 0) {
    this.$result.html(`
      <div class="text-center text-muted" style="padding: 100px;">
        <div class="mb-3">
          <svg class="icon icon-xl" style="width: 80px; height: 80px;">
            <use href="#icon-calendar"></use>
          </svg>
        </div>
        <h4>${__("No Tasks to Display")}</h4>
        <p class="text-muted">${__("All tasks are missing required dates")}</p>
      </div>
    `);
    return;
  }

  try {
    // 1) Create page-level shell (parent)
    const page_shell = document.createElement("div");
    page_shell.className = "gantt-page-shell";
    this.$result.append(page_shell);

    // 2) Create the inner wrapper where Gantt will mount
    const gantt_wrapper = document.createElement("div"); // <-- single, consistent name
    gantt_wrapper.className = "gantt-wrapper-container";
    page_shell.appendChild(gantt_wrapper);

// upper_header_height: 20,
// lower_header_height: 16,
// padding: 6,

    // 3) Initialize Gantt INTO gantt_wrapper
    this.gantt = new Gantt(gantt_wrapper, this.tasks, {
      bar_height: 30,
      bar_corner_radius: 3,
      upper_header_height: 0,
	  lower_header_height: 0,
	  padding: 18,
	  popup_on:'hover',
	  infinite_padding: false,
      view_mode: gantt_view_mode,
      date_format: date_format,
      view_mode_select: false,
      today_button: false,
      readonly: false,
      readonly_dates: false,
      readonly_progress: true,
	  language: frappe.boot.lang || 'en',
	
    //   on_click: (task) => {
	// 	if (me.gantt.bar_being_dragged) {
    //             console.log('🚫 Click blocked - drag in progress');
    //             return;
    //         }
    //     frappe.set_route("Form", task.doctype, task.id);
    //   },
      on_date_change: (task, start, end) => {
        if (!me.can_write) {
          frappe.show_alert({ message: __("You don't have permission to edit this task"), indicator: "red" });
          return;
        }
        frappe.db.set_value(task.doctype, task.id, {
          [field_map.start]: moment(start).format(date_format),
          [field_map.end]: moment(end).format(date_format),
        }).then(() => {
          frappe.show_alert({ message: __("Task dates updated"), indicator: "green" });
        }).catch((err) => {
          console.error("Error updating dates:", err);
          frappe.show_alert({ message: __("Error updating task dates"), indicator: "red" });
        });
      },
	  on_drag_undone: (state) => {
				//    if (this.dragHistory.length === 0) {
				// 	frappe.show_alert({ message: __('No drag actions to undo'), indicator: 'orange' });
				//    }
				//    else{
                   	frappe.show_alert({ message: __("Drag Undo", state), indicator: "green" });
				   //}
                    },
      on_progress_change: (task, progress) => {
        if (!me.can_write) {
          frappe.show_alert({ message: __("You don't have permission to edit this task"), indicator: "red" });
          return;
        }
        let progress_fieldname = $.isFunction(field_map.progress) ? null : (field_map.progress || "progress");
        if (progress_fieldname) {
          frappe.db.set_value(task.doctype, task.id, {
            [progress_fieldname]: parseInt(progress, 10),
          }).then(() => {
            frappe.show_alert({ message: __("Progress updated to {0}%", [progress]), indicator: "green" });
          }).catch((err) => {
            console.error("Error updating progress:", err);
            frappe.show_alert({ message: __("Error updating progress"), indicator: "red" });
          });
        }
      },
      on_view_change: (mode) => {
        const mode_name = typeof mode === "string" ? mode : mode.name;
        me.save_view_user_settings({ gantt_view_mode: mode_name });
      },
	  popup_func: ({ task, set_title, set_subtitle, set_details, add_action }) => {
    // 📝 Title: usually the task name
    set_title(task.name);

    // 📅 Subtitle: localized date formatting
    const startStr = moment(task.start).format("ll");
    const endStr = moment(task.end).format("ll");
    set_subtitle(`${startStr} → ${endStr}`);

    // 🧭 Details (this can be translated automatically depending on frappe language)
    let detailsHtml = `
      <div>
        <strong>${__('Progress')}:</strong> ${task.progress ?? 0}%
      </div>
      ${task.dependencies
        ? `<div><strong>${__('Dependencies')}:</strong> ${task.dependencies}</div>`
        : ''}
    `;
    set_details(detailsHtml);

    // 🧭 Optional action button (e.g. open Form)
    add_action(__('Open'), (t) => {
      frappe.set_route('Form', t.doctype, t.id);
    });

    return null;
  },
//       popup: {
//   show_on: "hover",
//   html: (task) => {
//     // Make sure you have a valid task object
//     if (!task) return "";

//     // Format dates safely
//     const start = moment(task._start).format("YYYY-MM-DD");
//     const end = moment(task._end).format("YYYY-MM-DD");
//     const duration = Math.round((task._end - task._start) / (1000 * 60 * 60 * 24));

//     // Build your list-style details
//     return `
//       <div class="details-container">
//         <div class="title" style="font-weight:600;">${task.name}</div>
//         <ul style="margin:6px 0 0 14px; padding:0; font-size:12px; line-height:1.5;">
//           <li><b>開始日:</b> ${start}</li>
//           <li><b>終了日:</b> ${end}</li>
//           <li><b>期間:</b> ${duration} 日</li>
//           <li><b>進捗:</b> ${task.progress ?? 0}%</li>
//           ${task.dependencies ? `<li><b>依存タスク:</b> ${task.dependencies}</li>` : ""}
//         </ul>
//       </div>
//     `;
//   }
// }
//,
    });

	///testing clcik disable 

// if (this.gantt.bars && this.gantt.bars.length > 0) {
//     const Bar = this.gantt.bars[0].constructor; // reference to Bar class

//     this.gantt.bars.forEach(barInstance => {
//         const wrapper = barInstance.$bar.parentNode; // usually bar-wrapper
//         if (wrapper && !wrapper.getAttribute('data-doctype')) {
//             wrapper.setAttribute('data-doctype', this.doctype || 'Task');
//         }
//     });

//     console.log('✅ Injected data-doctype for all bars via Bar constructor');
// }





// 	if (this.gantt && this.gantt.bars) {
//     this.gantt.bars.forEach(bar => {
//         const barElem = bar.$bar;

//         // Reset drag flag at the start
//         barElem.addEventListener('mousedown', () => {
//             me.gantt.bar_being_dragged = false;
//         });

//         // Detect movement (start dragging)
//         barElem.addEventListener('mousemove', (e) => {
//             if (!me.gantt.bar_being_dragged) {
//                 // Threshold to prevent accidental small moves
//                 if (Math.abs(e.movementX) > 2 || Math.abs(e.movementY) > 2) {
//                     me.gantt.bar_being_dragged = true;
//                 }
//             }
//         });

//         // Reset drag flag on mouseup
//         barElem.addEventListener('mouseup', () => {
//             // Use a small timeout to let click handlers run first
//             setTimeout(() => {
//                 me.gantt.bar_being_dragged = false;
//             }, 10);
//         });
//     });
// }


	this.setup_add_task_buttons();
// 	if (this.gantt.bars && this.gantt.bars.length > 0) {
//   const Bar = this.gantt.bars[0].constructor;
  
//   Bar.prototype.update_bar_position = function({ x = null, width = null }) {
//     const bar = this.$bar;

//     if (x) {
//       const xs = this.task.dependencies.map((dep) => {
//         return this.gantt.get_bar(dep).$bar.getX();
//       });
//       const valid_x = xs.reduce((prev, curr) => {
//         return prev && x >= curr;
//       }, true);
//       if (!valid_x) return;
//       this.update_attr(bar, 'x', x);
//       this.x = x;
//       this.$date_highlight.style.left = x + 'px';
//     }
//     if (width > 0) {
//       this.update_attr(bar, 'width', width);
//       this.$date_highlight.style.width = width + 'px';
//     }

//     this.update_label_position();
//     this.update_handle_position();
//     // REMOVED: this.date_changed(); 
//     this.compute_duration();

//     if (this.gantt.options.show_expected_progress) {
//       this.update_expected_progressbar_position();
//     }

//     this.update_progressbar_position();
//     this.update_arrow_position();
//   };
// }
	const styleId = "gantt-fix-style";
  if (!document.getElementById(styleId)) {
    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = `
      .gantt-header-container .lower-header .lower-text,
      .gantt-header-container .upper-header .upper-text { white-space: nowrap; }
      .gantt-header-container .lower-header .lower-text { padding-right: 6px; }

	  /* Make resize handles bigger and add pointer cursor */
    .gantt .handle {
      cursor: ew-resize !important;
      width: 8px !important;
      opacity: 0;
      transition: opacity 0.2s ease;
    }
    
    .gantt .handle:hover,
    .gantt .handle.active {
      opacity: 1 !important;
    }
    
    .gantt .handle.left {
      transform: translateX(-2px);
    }
    
    .gantt .handle.right {
      transform: translateX(2px);
    }
    
    /* Progress handle */
    .gantt .handle.progress {
      cursor: ew-resize !important;
      r: 6 !important;
      opacity: 0.6;
    }
    
    .gantt .handle.progress:hover,
    .gantt .handle.progress.active {
      opacity: 1 !important;
    }
    
    /* Make handles more visible on bar hover */
    .gantt .bar-wrapper:hover .handle {
      opacity: 0.8;
    }
    `;
    document.head.appendChild(style);
  }


// const styleId = "gantt-fix-style";
// if (!document.getElementById(styleId)) {
//   const style = document.createElement("style");
//   style.id = styleId;
//   style.textContent = `
//     /* Prevent header text from wrapping */
//     .gantt-header-container .lower-header .lower-text,
//     .gantt-header-container .upper-header .upper-text {
//       white-space: nowrap;
//     }
//     .gantt-header-container .lower-header .lower-text {
//       padding-right: 6px;
//     }

//     /* Keep handle hitbox but hide visually */
//     .gantt .handle {
//       fill: transparent !important; /* invisible but still receives mouse */
//       stroke: none;
//       opacity: 0;
//       cursor: ew-resize !important;
//       transition: all 0.2s ease;
//     }

//     /* Show visual arrow when hovering over bar */
//     .gantt .bar-wrapper:hover .handle {
//       fill: #666 !important;
//       opacity: 1;
//     }

//     /* Slightly arrow-like effect by stretching horizontally */
//     .gantt .handle.left {
//       transform: translateX(-2px) scaleX(1.2);
//     }
//     .gantt .handle.right {
//       transform: translateX(2px) scaleX(1.2);
//     }

//     /* Darken on hover */
//     .gantt .bar-wrapper:hover .handle.left,
//     .gantt .bar-wrapper:hover .handle.right {
//       fill: #222 !important;
//     }
//   `;
//   document.head.appendChild(style);
// }




    // 4) Footer goes on the shell (AFTER the wrapper)
    this.create_footer_controls(page_shell);

    // 5) Colors
    this.set_colors();

    // 6) Make sure header is aligned after first render
    this.gantt.sync_header_to_grid?.();

    console.log(`Gantt rendered successfully with ${this.tasks.length} tasks`);
  } catch (error) {
    console.error("Error rendering Gantt chart:", error);
    this.$result.html(`
      <div class="text-center text-danger" style="padding: 100px;">
        <div class="mb-3">
          <svg class="icon icon-xl text-danger" style="width: 80px; height: 80px;">
            <use href="#icon-alert-circle"></use>
          </svg>
        </div>
        <h4>${__("Error Rendering Gantt Chart")}</h4>
        <p class="text-muted">${error.message}</p>
        <pre class="text-left small text-muted" style="max-width: 600px; margin: 20px auto;">${error.stack || ""}</pre>
        <button class="btn btn-secondary btn-sm" onclick="location.reload()">${__("Reload Page")}</button>
      </div>
    `);
  }
}


	create_footer_controls(container) {
		const me = this;

		// Remove existing footer if any
		$(container).find(".gantt-footer-controls").remove();

		// Create footer HTML
		const footer = $(`
			<div class="gantt-footer-controls">
				<div class="footer-left">
					<button class="btn btn-sm btn-default today-btn">
						<svg class="icon icon-sm">
							<use href="#icon-calendar"></use>
						</svg>
						${__("Today")}
					</button>
				</div>
				<div class="footer-right">
					<label style="margin-right: 8px; font-weight: 500;">${__("View")}:</label>
					<select class="form-select form-select-sm view-mode-select">
						<option value="Quarter Day">${__("Quarter Day")}</option>
						<option value="Half Day">${__("Half Day")}</option>
						<option value="Day">${__("Day")}</option>
						<option value="Week">${__("Week")}</option>
						<option value="Month">${__("Month")}</option>
					</select>
				</div>
			</div>
		`);

		// Set current view mode
		const current_mode = this.view_user_settings.gantt_view_mode || "Day";
		footer.find(".view-mode-select").val(current_mode);

		// Append footer to container
		$(container).append(footer);

		// Bind Today button event
		footer.find(".today-btn").on("click", function () {
			if (me.gantt && me.gantt.scroll_current) {
				me.gantt.scroll_current();
				me.gantt.sync_header_to_grid?.();
			}
		});

		// Bind view mode change event
		footer.find(".view-mode-select").on("change", function () {
			const mode = $(this).val();
			if (me.gantt && me.gantt.change_view_mode) {
				me.gantt.change_view_mode(mode);
				  setTimeout(() => me.gantt.sync_header_to_grid?.(), 0);
			}
		});
	}

	set_colors() {
		const classes = this.tasks
			.map((t) => t.custom_class)
			.filter((c) => c && c.startsWith("color-"));

		if (classes.length === 0) return;

		let style = classes
			.map((c) => {
				const class_name = c.replace("#", "");
				const bar_color = "#" + c.substr(6);
				const progress_color = frappe.ui.color.get_contrast_color(bar_color);
				return `
					.gantt .bar-wrapper.${class_name} .bar {
						fill: ${bar_color};
					}
					.gantt .bar-wrapper.${class_name} .bar-progress {
						fill: ${progress_color};
					}
				`;
			})
			.join("");

		this.$result.prepend(`<style>${style}</style>`);
	}

	get_item(name) {
		return this.data.find((item) => item.name === name);
	}
	// Add these methods after the get_item() method and before get required_libs()

setup_add_task_buttons() {
    const me = this;
    
    if (!this.gantt) return;

    // Method to create new task via Frappe dialog
    this.gantt.create_frappe_task = function() {
        me.show_create_task_dialog();
    };

    // Draw the + circle button in SVG (appears after last task)
   // this.draw_svg_add_button();

    // Setup floating + button (bottom-right corner)
    this.setup_floating_add_button();
}

draw_svg_add_button() {
    const me = this;
    
    if (!this.gantt || !this.gantt.$svg) return;
    
    // Remove existing button if any
    if (this.gantt.$add_task_circle) {
        this.gantt.$add_task_circle.remove();
    }

    if (!this.gantt.bars || this.gantt.bars.length === 0) return;

    const lastBar = this.gantt.bars[this.gantt.bars.length - 1];
    const lastTask = lastBar.task;

    // Calculate position
    const circleY = 
        this.gantt.config.header_height +
        this.gantt.options.padding / 2 +
        (lastTask._index + 1) * (this.gantt.options.bar_height + this.gantt.options.padding) +
        this.gantt.options.bar_height / 2;
    
    const circleX = this.gantt.options.padding + 15;
    const radius = 12;

    // Create SVG group
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    group.setAttribute('class', 'add-task-circle');

    // Circle background
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', circleX);
    circle.setAttribute('cy', circleY);
    circle.setAttribute('r', radius);
    circle.setAttribute('class', 'add-task-circle-bg');

    // Plus sign - horizontal line
    const hLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    hLine.setAttribute('x1', circleX - 6);
    hLine.setAttribute('y1', circleY);
    hLine.setAttribute('x2', circleX + 6);
    hLine.setAttribute('y2', circleY);
    hLine.setAttribute('class', 'add-task-plus');

    // Plus sign - vertical line
    const vLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    vLine.setAttribute('x1', circleX);
    vLine.setAttribute('y1', circleY - 6);
    vLine.setAttribute('x2', circleX);
    vLine.setAttribute('y2', circleY + 6);
    vLine.setAttribute('class', 'add-task-plus');

    group.appendChild(circle);
    group.appendChild(hLine);
    group.appendChild(vLine);

    this.gantt.$svg.appendChild(group);
    this.gantt.$add_task_circle = group;

    // Click handler
    group.addEventListener('click', () => {
        me.show_create_task_dialog();
    });
}

// setup_floating_add_button() {
//     const me = this;
    
//     if (!this.gantt || !this.gantt.$container) return;

//     // Remove existing button
//     $(this.gantt.$container).find('.gantt-add-task-floating').remove();

//     const button = $(`
//         <button class="gantt-add-task-floating" title="${__('Add New Task')}">
//             <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
//                 <line x1="12" y1="5" x2="12" y2="19" stroke-width="3" stroke-linecap="round"/>
//                 <line x1="5" y1="12" x2="19" y2="12" stroke-width="3" stroke-linecap="round"/>
//             </svg>
//         </button>
//     `);

//     button.on('click', () => {
//         me.show_create_task_dialog();
//     });

//     $(this.gantt.$container).append(button);
// }

// setup_floating_add_button() {
//     const me = this;
    
//     if (!this.gantt || !this.gantt.$container) return;

//     $(this.gantt.$container).find('.gantt-add-task-floating').remove();

//     const buttonWrapper = document.createElement('div');
//     buttonWrapper.className = 'gantt-floating-button-wrapper';

//     const button = document.createElement('button');
//     button.className = 'gantt-add-task-floating';
//     button.setAttribute('data-gantt-floating-button', 'true');

//     button.innerHTML = `
//         <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
//             <line x1="12" y1="5" x2="12" y2="19" stroke-width="3" stroke-linecap="round"/>
//             <line x1="5" y1="12" x2="19" y2="12" stroke-width="3" stroke-linecap="round"/>
//         </svg>
//     `;

//     // Tooltip
//     const tooltip = document.createElement('span');
//     tooltip.className = 'gantt-button-tooltip';
//     tooltip.textContent = __('Add Task');

//     buttonWrapper.appendChild(tooltip);
//     buttonWrapper.appendChild(button);

//     button.addEventListener('click', () => {
//         me.show_create_task_dialog();
//     });

//     // Show/hide tooltip on hover
//     button.addEventListener('mouseenter', () => {
//         tooltip.classList.add('show');
//     });

//     button.addEventListener('mouseleave', () => {
//         tooltip.classList.remove('show');
//     });

//     this.gantt.$container.appendChild(buttonWrapper);

//     console.log('✅ Floating add button created');
// }

setup_floating_add_button() {
    const me = this;
    
    console.log('🔧 Setting up floating button...');
    
    // Remove any existing buttons first
    const existing = document.querySelectorAll('.gantt-add-task-floating');
    existing.forEach(btn => {
        btn.remove();
        console.log('🗑️ Removed existing button');
    });

    // Create button exactly like the test
    const button = document.createElement('button');
    button.className = 'gantt-add-task-floating';
    button.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="white" style="width: 24px; height: 24px;">
            <line x1="12" y1="5" x2="12" y2="19" stroke-width="3" stroke-linecap="round"/>
            <line x1="5" y1="12" x2="19" y2="12" stroke-width="3" stroke-linecap="round"/>
        </svg>
    `;
    
    // Inline styles (guaranteed to work)
    button.style.cssText = `
        position: fixed !important;
        bottom: 30px !important;
        right: 30px !important;
        width: 56px !important;
        height: 56px !important;
        background: #2490ef !important;
        color: white !important;
        border: none !important;
        border-radius: 50% !important;
        cursor: pointer !important;
        z-index: 99999 !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3) !important;
        transition: all 0.3s ease !important;
    `;
    
    button.title = __('Add New Task');

    // Click handler
    button.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('✅ Add button clicked');
        me.show_create_task_dialog();
    });

    // Hover effects
    button.addEventListener('mouseenter', () => {
        button.style.background = '#1976d2';
        button.style.transform = 'scale(1.1)';
    });

    button.addEventListener('mouseleave', () => {
        button.style.background = '#2490ef';
        button.style.transform = 'scale(1)';
    });

    // Append directly to body (like the test)
    document.body.appendChild(button);
    
    console.log('✅ Floating button added to body');
    
    // Verify it's there
    setTimeout(() => {
        const check = document.querySelector('.gantt-add-task-floating');
        if (check) {
            console.log('✅ Button confirmed in DOM');
        } else {
            console.error('❌ Button not found in DOM!');
        }
    }, 100);
}

show_create_task_dialog() {
    const me = this;
    const field_map = this.calendar_settings.field_map;

    // Get default dates based on last task
    const default_start = this.get_default_start_date();
    const default_end = this.get_default_end_date();

    const dialog = new frappe.ui.Dialog({
        title: __('Create New Task'),
        fields: [
            {
                fieldtype: 'Data',
                fieldname: 'title',
                label: __(frappe.model.unscrub(field_map.title || 'Title')),
                reqd: 1
            },
            {
                fieldtype: 'Column Break'
            },
            {
                fieldtype: 'Date',
                fieldname: 'start_date',
                label: __(frappe.model.unscrub(field_map.start || 'Start Date')),
                default: default_start,
                reqd: 1
            },
            {
                fieldtype: 'Date',
                fieldname: 'end_date',
                label: __(frappe.model.unscrub(field_map.end || 'End Date')),
                default: default_end,
                reqd: 1
            },
            {
                fieldtype: 'Section Break'
            },
            {
                fieldtype: 'Int',
                fieldname: 'progress',
                label: __('Progress (%)'),
                default: 0,
                description: __('Task completion percentage (0-100)')
            },
            {
                fieldtype: 'Column Break'
            },
            {
                fieldtype: 'Link',
                fieldname: 'depends_on',
                label: __('Depends On'),
                options: this.doctype,
                description: __('Select a task this depends on')
            },
			{
                fieldtype: 'Link',
                fieldname: 'project',
                label: __('Project'),
                options: "Project",
                description: __('Select The Project')
            },
			{
                fieldtype: 'Link',
                fieldname: 'parent_task',
                label: __('Parent Task'),
                options: this.doctype,
                description: __('Select The Parent Task')
            }
        ],
        primary_action_label: __('Create Task'),
        primary_action: (values) => {
            // Validate dates
            if (values.end_date < values.start_date) {
                frappe.msgprint(__('End date cannot be before start date'));
                return;
            }

            // Validate progress
            if (values.progress < 0 || values.progress > 100) {
                frappe.msgprint(__('Progress must be between 0 and 100'));
                return;
            }

            me.create_new_task(values);
            dialog.hide();
        }
    });

    dialog.show();
}

get_default_start_date() {
    if (this.gantt && this.gantt.tasks && this.gantt.tasks.length > 0) {
        const lastTask = this.gantt.tasks[this.gantt.tasks.length - 1];
        const lastEnd = moment(lastTask.end);
        return lastEnd.add(1, 'day').format('YYYY-MM-DD');
    }
    return frappe.datetime.now_date();
}

get_default_end_date() {
    const startDate = this.get_default_start_date();
    return moment(startDate).add(7, 'days').format('YYYY-MM-DD');
}
// on_remove() {
//     // Remove floating button
//     if (this.gantt && this.gantt.$container) {
//         $(this.gantt.$container).find('.gantt-add-task-floating').remove();
//     }

//     // Remove keyboard shortcuts
//     if (this._keydownHandler) {
//         document.removeEventListener('keydown', this._keydownHandler);
//     }

//     // Call parent cleanup
//     if (super.on_remove) {
//         super.on_remove();
//     }
// }

on_remove() {
    console.log('🧹 Cleaning up Gantt view...');
    
    // Remove floating button
    const buttons = document.querySelectorAll('.gantt-add-task-floating');
    buttons.forEach(btn => {
        btn.remove();
        console.log(' Floating button removed');
    });

    // Remove keyboard shortcuts
    if (this._keydownHandler) {
        document.removeEventListener('keydown', this._keydownHandler);
    }

    // Call parent cleanup
    if (super.on_remove) {
        super.on_remove();
    }
}

create_new_task(values) {
    const me = this;
    const field_map = this.calendar_settings.field_map;

    // Build the new document
    const new_doc = {
        doctype: this.doctype,
        [field_map.title]: values.title,
        [field_map.start]: values.start_date,
        [field_map.end]: values.end_date,

    };

    // Add progress field if mapped
    if (field_map.progress && !$.isFunction(field_map.progress)) {
        new_doc[field_map.progress] = values.progress || 0;
    }

    // Add dependencies if provided
    if (values.depends_on) {
        new_doc['depends_on_tasks'] = values.depends_on;
    }

	if (values.project) {
        new_doc['project'] = values.project;
    }
	if (values.parent_task) {

		new_doc['parent_task'] = values.parent_task;
	}
    // Show loading indicator
    frappe.show_alert({
        message: __('Creating task...'),
        indicator: 'blue'
    });

    // Create the document
    frappe.call({
        method: 'frappe.client.insert',
        args: {
            doc: new_doc
        },
        callback: (r) => {
            if (r.message) {
                frappe.show_alert({
                    message: __('Task {0} created successfully', [r.message.name]),
                    indicator: 'green'
                });

                // Refresh the gantt view
                setTimeout(() => {
                    me.refresh();
                }, 500);
            }
        },
        error: (err) => {
            console.error('Error creating task:', err);
            frappe.show_alert({
                message: __('Error creating task'),
                indicator: 'red'
            });
        }
    });
}

	get required_libs() {
		return [];
	}
};