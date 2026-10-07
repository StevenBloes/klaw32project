/* 01_tables.sql ******************************************************
  SQL script for creating the database tables
**********************************************************************/
/********************************************************************* 
  Master Data: data that recurs in multiple schemas of the database 
**********************************************************************/

CREATE TABLE master_data.customer (
	id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	customer_name text NOT NULL,
	telephone text,
	mail_address text,
	remarks text	
);

CREATE TABLE master_data.customer_address (
	id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	customer_id bigint NOT NULL,
	address_id bigint NOT NULL
);

CREATE TABLE master_data.address (
	id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	postal_location_id bigint NOT NULL,
	street text,
	house_number text,
	remarks text
);

CREATE TABLE master_data.postal_location (
	id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	postal_code text NOT NULL,
	city text NOT NULL,
	country text NOT NULL
);


/********************************************************************* 
  Reference: small lookup lists 
**********************************************************************/

CREATE TABLE reference.unit (
	id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	unit text NOT NULL
);


/********************************************************************* 
  HR: everything human resource related
**********************************************************************/

CREATE TABLE hr.employee (
	id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	name text NOT NULL,
	full_name text NOT NULL,
	is_active boolean
);

CREATE TABLE hr.employee_group_membership (
	id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	employee_id bigint NOT NULL,
	employee_group_id bigint NOT NULL
);

CREATE TABLE hr.employee_group (
	id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	code text NOT NULL,
	description text
);


/********************************************************************* 
  Logistics: everything transport related
**********************************************************************/

CREATE TABLE logistics.transport (
	id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	transport_name text,
	telephone text,
	mail_address text,
	remarks text	
);

CREATE TABLE logistics.transport_planning (
	id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	transport_id bigint NOT NULL,
	planned_date date NOT NULL,
	planned_time time(0),
	arrival_time time(0),
	departure_time time(0),
	remarks text	
);


/********************************************************************* 
  Sales: sales orders and ordered products with details
**********************************************************************/

CREATE TABLE sales.customer_order (
	id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	customer_id bigint NOT NULL REFERENCES outbound_order.customer,
	transport_planning_id bigint NOT NULL,
	requested_date date NOT NULL,
	remarks text
);

CREATE TABLE sales.ordered_product (
	id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	order_id bigint NOT NULL,
	packaging_type bigint NOT NULL,
	recipe_id bigint,
	external_product_id bigint,
	order_status_id bigint NOT NULL,
	amount numeric(12,2),
	remarks text	
)

CREATE TABLE sales.packaging_type (
	id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	code text
); 

CREATE TABLE sales.order_status (
	id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	code text
);

CREATE TABLE sales.ordered_bigbag_detail (
	id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	bag_count smallint,
	bag_size smallint
);


/********************************************************************* 
  Product: internal and external products with their recipes and raw materials
**********************************************************************/

CREATE TABLE product.external_product (
	id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	name text NOT NULL
)
 
CREATE TABLE product.product (
	id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	product_formula_id bigint,
	customer_id bigint,
	resource_type bigint,
	product_name text NOT NULL,
	product_code text,
	requires_weighing boolean DEFAULT false,
	max_batch_volume numeric(12,2),
	max_batch_weight numeric(12,2),
	is_active boolean DEFAULT true,
	updated_at timestamp
)

CREATE TABLE product.product_formula (
	id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	product_id bigint NOT NULL,
	resource_id bigint NOT NULL,
	sieve_type_id bigint NOT NULL,
	formula_hash char(64),
	formula_definition json,
	first_produced_at timestamp,
	last_produced_at timestamp,
	is_active boolean
)

CREATE TABLE product.material (
	id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	material_category_id bigint,
	rhp_status_id bigint,
	delivery_mode_id bigint,
	secondary_id text,
	material_name text,
	material_name_simplified text,
	is_ecocert_approved boolean,
	is_active boolean
)

CREATE TABLE product.material_category (
	id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	unit_id bigint NOT NULL,
	code text NOT NULL	
)

CREATE TABLE product.rhp_status (
	id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	code text NOT NULL,
	description text	
);

CREATE TABLE product.material_component_link (
	id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	material_id bigint NOT NULL,
	component_material_id bigint NOT NULL,
	percentage decimal(3,2) NOT NULL
)


/********************************************************************* 
  Production: production and batch data
**********************************************************************/

CREATE TABLE production.production_batch (
	id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	product_formula bigint,
	batch_started_at timestamp,
	batch_finished_at timestamp,
	recipe_name_snapshot text,
	customer_code text,
	target_volume numeric(12,2),
	target_weight numeric(12,2),
	actual_volume numeric(12,2),
	actual_en_volume numeric(12,2),
	actual_weight numeric(12,2),
	desnity numeric(12,2),
	line_capacity numeric(12,2),
	remarks text	
);

CREATE TABLE production.batch_material_consumption (
	id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	production_batch_id bigint NOT NULL,
	material_id bigint NOT NULL,
	target numeric(12,2) NOT NULL,
	actual numeric(12,2) NOT NULL,
	total_used numeric(12,2) NOT NULL
);

CREATE TABLE production.execution_task (
	id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	task_type_id bigint,
	resource_id bigint,
	status_id bigint,
	planned_date date,
	target_start_time time(0),
	target_finished_time time(0),
	actual_start_time time(0),
	actual_finished_time(0),
	remarks text
);

CREATE TABLE production.task_type (
	id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	task_category_id bigint NOT NULL,
	code text	
);

CREATE TABLE task_category (
	id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	code text
);

CREATE TABLE production.task_dependancy (
	id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	execution_task_id bigint,
	depends_on_task_id bigint
);

CREATE TABLE production.task_status (
	id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	code text
);

CREATE TABLE production.production_task (
	id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	execution_task_id bigint NOT NULL,
	ordered_product_id, /* can be NULL to produce products not linked to orders */
	recipe_id bigint NOT NULL,
	to_storage_location_id bigint NOT NULL;
);

CREATE TABLE production.task_production_batch_link (
	id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	production_task_id bigint NOT NULL,
	production_batch_id bigint NOT NULL
);

CREATE TABLE production.packaging_task (
	id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	execution_task_id bigint NOT NULL,
	ordered_product_id bigint,
	to_storage_location_id bigint NOT NULL;
);

CREATE TABLE production.blocking_task (
	id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	execution_task_id bigint NOT NULL,
	maintenance_event_id bigint
);


/********************************************************************* 
  Maintenance: maintenance related tables
**********************************************************************/

CREATE TABLE maintenance.maintenance_event (
	id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	blocking_task_id bigint, /* can be NULL, not all maintenance events block a resource */
	maintenance_type_id bigint NOT NULL,
	maintenance_plan_id bigint, /* can be NULL, not all maintenace events are planned */
	resource_id bigint,
	resource_component_id bigint,
	reason text,
	executed_at date,
	remarks text,
	restricts_resource boolean
);

CREATE TABLE maintenance.maintenance_type (
	id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	code text,
	description text
);

CREATE TABLE maintenance.maintenance_event_assignment (
	id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	
);

CREATE TABLE maintenance.maintenance_plan (
	id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
);

CREATE TABLE maintenance.maintenance_event (
	id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
);



CREATE TABLE schema.table (
	id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
);

CREATE TABLE schema.table (
	id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
);

CREATE TABLE schema.table (
	id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
);

CREATE TABLE schema.table (
	id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
);

CREATE TABLE schema.table (
	id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
);

CREATE TABLE schema.table (
	id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
);

CREATE TABLE schema.table (
	id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
);

CREATE TABLE schema.table (
	id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
);

CREATE TABLE schema.table (
	id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
);

CREATE TABLE schema.table (
	id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
);

CREATE TABLE schema.table (
	id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
);

CREATE TABLE schema.table (
	id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
);
CREATE TABLE schema.table (
	id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
);

CREATE TABLE schema.table (
	id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
);

CREATE TABLE schema.table (
	id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
);

CREATE TABLE schema.table (
	id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
);

CREATE TABLE schema.table (
	id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
);

CREATE TABLE schema.table (
	id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
);

CREATE TABLE schema.table (
	id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
);

CREATE TABLE schema.table (
	id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
);

CREATE TABLE schema.table (
	id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
);

CREATE TABLE schema.table (
	id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
);

CREATE TABLE schema.table (
	id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
);

CREATE TABLE schema.table (
	id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
);
CREATE TABLE schema.table (
	id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
);

CREATE TABLE schema.table (
	id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
);

CREATE TABLE schema.table (
	id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
);

CREATE TABLE schema.table (
	id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
);

CREATE TABLE schema.table (
	id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
);

CREATE TABLE schema.table (
	id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
);

CREATE TABLE schema.table (
	id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
);

CREATE TABLE schema.table (
	id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
);

CREATE TABLE schema.table (
	id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
);

CREATE TABLE schema.table (
	id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
);

CREATE TABLE schema.table (
	id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
);

CREATE TABLE schema.table (
	id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
);