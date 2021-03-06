frappe.pages['advanced-sales-funnel'].on_page_load = function(wrapper) {
	var page = frappe.ui.make_app_page({
		parent: wrapper,
		title: 'Advanced Sales Funnel',
		single_column: true
	});
	wrapper.sales_funnel = new AdvancedSalesFunnel(page, wrapper);

	frappe.breadcrumbs.add("Analytics");
}

this.AdvancedSalesFunnel = Class.extend({
	init: function(page, wrapper) {
		var me = this;
		// 0 setTimeout hack - this gives time for canvas to get width and height
		setTimeout(function() {
			me.setup(wrapper);
			me.get_data(page);
		}, 100);
	},
	get_sales_people: function() {
		var me = this;
		return frappe.call({
			method: "frappe.client.get_list",
			args: {
				"doctype": "Sales Person"
			},
			callback: function(r) {
				sales_people = []
				r.message.forEach(function(obj){
					sales_people.push(obj.name)
				})
			}
		})
	},
	setup: function(wrapper) {
		var me = this;
		sales_people = me.get_sales_people();

		this.elements = {
			layout: $(wrapper).find(".layout-main"),
			from_date: wrapper.page.add_date(__("From Date")),
			to_date: wrapper.page.add_date(__("To Date")),
			date_range: wrapper.page.add_field(
				{fieldtype:"Select", label: __("Range"), fieldname: "date_range",
				  default:"Weekly",
					options:[{label: __("Daily"), value: "Daily"},
					{label: __("Weekly"), value: "Weekly"},
					{label: __("Monthly"), value: "Monthly"},
					{label: __("Quarterly"), value: "Quarterly"},
					{label: __("Yearly"), value: "Yearly"}
					]
				}),
			leads: wrapper.page.add_field(
				{fieldtype: "Check", label: __("Leads"), "default": true, fieldname: "leads"}
			),
			opportunities: wrapper.page.add_field(
				{fieldtype: "Check", label: __("Opportunities"), "default": true}
			),
			quotations: wrapper.page.add_field(
				{fieldtype: "Check", label: __("Quotations"), "default": true}
			),
			sales_person: wrapper.page.add_select(
				__("Sales Person"),
				['All', 'moe.barry@energychoice.com', 'manda.schulman@energychoice.com']
			),
			refresh_btn: wrapper.page.set_primary_action(__("Reload"),
				function() { me.get_data(); }, "icon-refresh"
			),
		};
		this.options = {
			from_date: frappe.datetime.add_months(frappe.datetime.get_today(), -1),
			to_date: frappe.datetime.get_today(),
			date_range: "Weekly",
			sales_person: "All",
			leads: true,
			opportunities: true,
			quotations: true
		};
		$.each(this.options, function(k, v) {
			try{
				me.elements[k].val(frappe.datetime.str_to_user(v));
				me.elements[k].on("change", function() {
					me.options[k] = frappe.datetime.user_to_str($(this).val());
				});
			}catch(err){
			}
		});
		// bind refresh
		this.elements.refresh_btn.on("click", function() {
			//me.get_data();
		});
	},
	get_data: function(page, btn) {
		var me = this;
		sales_person = ($(me.elements.sales_person).val())
		frappe.call({
			method: "analytics.analytics.page.advanced_sales_funnel.advanced_sales_funnel.get_funnel_data",
			args: {
				from_date: me.options.from_date,
				to_date: me.options.to_date,
				date_range: $(me.elements.date_range.get_value()).selector,
				salesperson: sales_person,
				leads: $(me.elements.leads.get_value()).length,
				opportunities: $(me.elements.opportunities.get_value()).length,
				quotations: $(me.elements.quotations.get_value()).length
			},
			btn: btn,
			callback: function(r) {
				if(!r.exc) {
					var funnel_data = r.message.dataset;
					var columns = r.message.columns;
					if($("#myChart").length == 0){
						$(".layout-main-section").append("<canvas id='myChart'></canvas>");
					}else{
						$("#myChart").remove()
						$(".layout-main-section").append("<canvas id='myChart'></canvas>");
					};
					var ctx = $("#myChart");
					var myChart = new Chart(ctx, {
					  type: "bar",
					  data: {
					    labels: columns,
					    datasets: funnel_data
					  },
					  options: {
					    scales: {
					      xAxes: [{
					        stacked: true
					      }],
					      yAxes: [{
					        stacked: true,
					        ticks: {
					          beginAtZero: true
					        }
					      }]
					    }
					  }
					});
				}
			}
		});
	}
});
