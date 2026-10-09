/* 01_tables.sql ******************************************************
  SQL script for creating the database tables
**********************************************************************/
/********************************************************************* 
  Master Data: data that recurs in multiple schemas of the database 
**********************************************************************/

CREATE TABLE master_data.supplier (
	id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	supplier_name text NOT NULL,
	telephone text,
	mail_address text,
	notes text	
);

CREATE TABLE master_data.customer (
	id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	customer_name text NOT NULL,
	telephone text,
	mail_address text,
	notes text	
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
	notes text
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
	/* kg, ton, m³, EN-m³, °C, µS/cm, ... */
	id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	unit text NOT NULL
);

CREATE TABLE reference.frequency_rule_type (
	/* EVERY, EVERY_N, RANDOM, MANUAL */
	id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	code text NOT NULL
);

CREATE TABLE reference.interval_unit (
	/* WORKING_HOUR, DAY, WEEK, MONTH, YEAR	*/
	id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	unit text NOT NULL
)


/********************************************************************* 
  Facility: facility locations, such as areas, gates, rooms, ...
**********************************************************************/

CREATE TABLE facility.location (
	/* parent_location_id helps making locations hierarchical,
		a building contains, different rooms, gates, area, ...
	*/
	id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	location_type_id bigint NOT NULL,
	parent_location_id bigint,
	code text NOT NULL,
	description text	
);

CREATE TABLE facility.location_type (
	/* SITE, BUILDING, ROOM, GATE, AREA, QUAY, STORAGE_LOCATION, LOADING_AREA, PARKING */
	id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	code text NOT NULL,
	description text
);


/* this scheme could be further expanded with facility.fence/gate/camera/alarm/etc. */

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

CREATE TABLE logistics.carrier (
	id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	transport_name text NOT NULL,
	telephone text,
	mail_address text,
	notes text	
);

CREATE TABLE logistics.shipment (
	id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	carrier_id bigint NOT NULL,
	planned_date date NOT NULL,
	planned_time time(0),
	arrival_time time(0),
	departure_time time(0),
	notes text	
);


/********************************************************************* 
  Sales: sales orders and ordered products with details
**********************************************************************/

CREATE TABLE sales.customer_order (
	id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	customer_id bigint NOT NULL REFERENCES outbound_order.customer,
	shipment_id bigint NOT NULL,
	requested_date date NOT NULL,
	notes text
);

CREATE TABLE sales.ordered_product (
	id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	order_id bigint NOT NULL,
	packaging_type bigint NOT NULL,
	stock_item_id bigint, 
	order_status_id bigint NOT NULL,
	amount numeric(12,2),
	notes text
);

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

CREATE TABLE product.internal_product (
	id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	stock_item_id bigint NOT NULL UNIQUE,
	product_formula_id bigint,
	customer_id bigint,
	resource_type bigint,
	product_code text,
	requires_weighing boolean DEFAULT false,
	max_batch_volume numeric(12,2),
	max_batch_weight numeric(12,2),
	is_active boolean DEFAULT true,
	updated_at timestamp
)

CREATE TABLE product.product_formula (
	id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	internal_product_id bigint NOT NULL,
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
	stock_item_id bigint,
	material_category_id bigint,
	rhp_status_id bigint,
	delivery_mode_id bigint,
	secondary_id text,
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
	stock_item_name_snapshot text,
	customer_code text,
	target_volume numeric(12,2),
	target_weight numeric(12,2),
	actual_volume numeric(12,2),
	actual_en_volume numeric(12,2),
	actual_weight numeric(12,2),
	desnity numeric(12,2),
	line_capacity numeric(12,2),
	notes text	
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
	notes text
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
	internal_product_id bigint NOT NULL,
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

CREATE TABLE maintenance.event (
	id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	event_type_id bigint NOT NULL,
	blocking_task_id bigint, /* can be NULL, not all maintenance events block a resource */
	schedule_id bigint, /* can be NULL, not all maintenace events are planned */
	resource_id bigint,
	resource_component_id bigint,
	reason text,
	executed_at date,
	notes text,
	restricts_resource boolean
);

CREATE TABLE maintenance.event_type (
	id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	code text NOT NULL,
	description text
);

CREATE TABLE maintenance.assignment (
	id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	event_id bigint NOT NULL,
	employee_id bigint NOT NULL	
);

CREATE TABLE maintenance.schedule (
	id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	resource_id bigint,
	resource_component_id bigint,
	event_type_id bigint,
	employee_group_id bigint,
	interval_unit_id bigint,
	interval_value int,
	duration int,
	description text,
	last_executed_at date,
	restricts_resource boolean,
	is_active boolean
);


/********************************************************************* 
  Operations: resource related tables
**********************************************************************/

CREATE TABLE operations.resource (
	id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	location_id bigint NOT NULL,
	resource_type_id bigint NOT NULL,
	code text NOT NULL,
	description text	
);

CREATE TABLE operations.resource_type (
	id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	code text NOT NULL
);

CREATE TABLE operations.resource_component (
	id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	resource_id bigint NOT NULL,
	code text NOT NULL,
	description text
);

CREATE TABLE operations.resource_capability (
	id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	resource_id bigint NOT NULL,
	task_type_id bigint NOT NULL,
	priority int
);


/********************************************************************* 
  Claims: everything claim related
**********************************************************************/

CREATE TABLE claim.claim (
	id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	type_id bigint NOT NULL,
	catergory_id bigint NOT NULL,
	created_by bigint NOT NULL,
	closed_by bigint,
	status_id bigint NOT NULL,
	description text,
	created_at timestamp NOT NULL,
	closed_at timestamp
);

CREATE TABLE claim.attachment (
	id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	claim_id bigint NOT NULL,
	uploaded_by bigint NOT NULL,
	file_path text,
	file_type text,
	uploaded_at timestamp
);

CREATE TABLE claim.order_link (
	id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	claim_id bigint NOT NULL,
	order_id bigint NOT NULL
);

CREATE TABLE claim.production_batch_link (
	id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	claim_id bigint NOT NULL,
	production_batch_id bigint NOT NULL
);

CREATE TABLE claim.inbound_delivery_link (
	id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	claim_id bigint NOT NULL,
	inbound_delivery_id NOT NULL
);

CREATE TABLE claim.quality_check_link (
	id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	claim_id bigint NOT NULL,
	quality_check_id NOT NULL
);

CREATE TABLE claim.party (
	id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	claim_id bigint NOT NULL,
	claim_party_type_id bigint NOT NULL,
	claim_role_id bigint NOT NULL,
	supplier_id bigint,
	customer_id bigint
);

CREATE TABLE claim.follow_up (
	id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	claim_id bigint NOT NULL,
	follow_up_type_id bigint NOT NULL,
	done_by bigint,
	description text,
	result text,
	done_at timestamp
);
CREATE TABLE claim.follow_up_quality_check_link (
	id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	follow_up_id bigint NOT NULL,
	quality_check_id bigint NOT NULL
);

CREATE TABLE claim.claim_status (
	id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	code text NOT NULL
);

CREATE TABLE claim.status_history (
	id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	claim_id bigint NOT NULL,
	claim_status_id bigint NOT NULL,
	changed_by bigint NOT NULL,
	changed_at timestamp NOT NULL,
	notes text
);

CREATE TABLE claim.party_type (
	id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	code text NOT NULL
);

CREATE TABLE claim.claim_role (
	id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	code text NOT NULL
);

CREATE TABLE claim.follow_up_type (
	id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	code text NOT NULL
);

CREATE TABLE claim.root_cause_link (
	id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	claim_id bigint NOT NULL,
	root_cause_id bigint NOT NULL
);

CREATE TABLE claim.claim_type (
	id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	code text NOT NULL,
	description text
);

CREATE TABLE claim.claim_category (
	id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	code text NOT NULL,
	description text
);

CREATE TABLE claim.compensation (
	id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	claim_id bigint NOT NULL,
	compensation_type_id bigint NOT NULL,
	compensation_product_type bigint,
	created_by bigint NOT NULL,
	quantity decimal(14,2),
	unit_value decimal(14,2),
	compensation_value decimal(14,2),
	description text,
	created_at timestamp
);

CREATE TABLE claim.compensation_product (
	id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	compensation_id bigint NOT NULL,
	external_product_id bigint NOT NULL
);

CREATE TABLE claim.compensation_external_product (
	id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	compensation_id bigint NOT NULL,
	internal_product_id bigint NOT NULL
);
CREATE TABLE claim.root_causes (
	id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	root_cause_category_id bigint NOT NULL,
	code text NOT NULL,
	description text
);

CREATE TABLE claim.root_cause_category (
	id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	code text NOT NULL
);

CREATE TABLE claim.compensation_type (
	id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	code text NOT NULL
);

CREATE TABLE claim.compensation_type (
	id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	code text NOT NULL
);


/********************************************************************* 
  Quality: quality checks and quality sampling plan
**********************************************************************/

CREATE TABLE quality.quality_check (
	id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	quality_check_type_id bigint NOT NULL,
	schedule_id bigint,
	quality_check_status_id,
	executed_at timestamp,
	reason text,
	notes text
);

CREATE TABLE quality.order_link (
	id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	quality_check_id bigint NOT NULL,
	order_id bigint NOT NULL
);

CREATE TABLE quality.ordered_product_link (
	id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	quality_check_id bigint NOT NULL,
	ordered_product_id bigint NOT NULL
);

CREATE TABLE quality.inbound_delivery_link (
	id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	quality_check_id bigint NOT NULL,
	inbound_delivery_id bigint NOT NULL
);

CREATE TABLE quality.resource_link (
	id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	quality_check_id bigint NOT NULL,
	resource_id bigint NOT NULL
);

CREATE TABLE quality.sample_link (
	id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	quality_check_id bigint NOT NULL,
	sample_id bigint NOT NULL
);

CREATE TABLE quality.check_result (
	id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	quality_check_id bigint,
	unit_id bigint,
	parameter text,
	value text
);

CREATE TABLE quality.quality_check_status (
	id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	quality_check_id bigint,
	code text
);

CREATE TABLE quality.quality_check_type (
	id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	code text NOT NULL,
	description text
);

CREATE TABLE quality.sample (
	id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	sample_type_id bigint NOT NULL,
	stock_item_id bigint,
	sample_source_type_id bigint NOT NULL,
	sample_name text,
	notes text,
	created_at date NOT NULL,
	destroyed_at date
	/* sample must have at least a sample_name or an stock_item */
	CHECK (
		sample_name IS NOT NULL
		OR 
		stock_item_id IS NOT NULL
	)
);

CREATE TABLE quality.sample_type (
	/* PRODUCT, ENVIRONMENTAL, OTHER */
	id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	code text NOT NULL
);

CREATE TABLE quality.sample_source_type (
	/* PRODUCTION_BATCH, INBOUND_DELIVERY_ITEM, PALLET, STOCKPILE, CLAIM, CUSTOMER */
	id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	code text NOT NULL
);

CREATE TABLE quality.sample_production_batch_link (
	sample_id bigint PRIMARY KEY,
	production_batch_id bigint NOT NULL
);

CREATE TABLE quality.sample_inbound_delivery_link (
	sample_id bigint PRIMARY KEY,
	inbound_delivery_item_id bigint NOT NULL
);

CREATE TABLE quality.sample_pallet_link (
	sample_id bigint PRIMARY KEY,
	pallet_id bigint NOT NULL
);

CREATE TABLE quality.sample_customer_link (
	sample_id bigint PRIMARY KEY,
	customer_id bigint NOT NULL
);

CREATE TABLE quality.sample_location_link (
	sample_id bigint PRIMARY KEY,
	location_id bigint NOT NULL
);

CREATE TABLE quality.sample_aliquot (
	id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	sample_id bigint NOT NULL,
	location_id bigint,
	location_code text
);

CREATE TABLE quality.schedule (
	id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	quality_check_type_id bigint NOT NULL,
	frequency_rule_type_id bigint NOT NULL,
	interval_unit_id bigint,
	trigger_scope_id bigint,
	rule_parameter int,
	delivery_mode_id bigint,
	description text,
	is_active boolean NOT NULL DEFAULT true,
	
	/* interval_unit OR trigger_scope */
	CONSTRAINT chk_interval_or_trigger
	CHECK (
		(interval_unit_id IS NOT NULL AND trigger_scope_id IS NULL)
		OR
		(interval_unit_id IS NULL AND trigger_scope_id IS NOT NULL)
	)
);

CREATE TABLE quality.schedule_material_link (
	id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	schedule_id bigint NOT NULL,
	material_id bigint NOT NULL
)

CREATE TABLE quality.quality_trigger_scope (
	/* ORDERED_PRODUCT, ORDER, PRODUCED_BATCH, INBOUND_DELIVERY */
	id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	code text NOT NULL
);


/********************************************************************* 
  Warehouse: tracking of materials
**********************************************************************/

CREATE TABLE warehouse.staged_inventory (
	id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	pallet_id bigint,
	location_id bigint,
	quantity decimal(14,2),
	created_at timestamp
);

CREATE TABLE warehouse.pallet_status (
	id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	code text,
	description text
);

CREATE TABLE warehouse.movement_type (
	id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	affects_quantity boolean,
	affects_location boolean,
	requires_scan boolean
);

CREATE TABLE warehouse.pallet (
	id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	location_id bigint,
	pallet_type_id bigint,
	pallet_status_id bigint,
	barcode text,
	quantity decimal(14,2)
);

CREATE TABLE warehouse.pallet_type (
	/* FERTILIZER, BIGBAG, PACKAGED */
	id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	code text
);

CREATE TABLE warehouse.pallet_movement (
	id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	pallet_id bigint,
	movement_type bigint,
	from_location_id bigint,
	to_location_id bigint,
	movement_by bigint,
	movement_at timestamp,
	quantity decimal(14,2),
	notes text
);

CREATE TABLE warehouse.pallet_material_link (
	id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	pallet_id bigint,
	material_id bigint
);

CREATE TABLE warehouse.pallet_external_product_link (
	id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	pallet_id bigint,
	external_product_id bigint
);

CREATE TABLE warehouse.pallet_production_batch_link (
	id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	pallet_id bigint,
	production_batch_id bigint
);

CREATE TABLE warehouse.pallet_inbound_delivery_item_link (
	id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	pallet_id bigint,
	inbound_delivery_item_id bigint
);

CREATE TABLE warehouse.pallet_consumption (
	id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	pallet_id bigint,
	consumption_source_id bigint,
	batch_material_consumption_id bigint,
	quantity decimal(14,2),
	consumed_at timestamp	
);

CREATE TABLE consumption_source (
	/* STAGED_USAGE, PALLET_USAGE, ADJUSTMENT */
	id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	code text
);

CREATE TABLE warehouse. pallet_count (
	id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	performed_by bigint,
	performed_at timestamp
);

CREATE TABLE warehouse.pallet_verification (
	id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	pallet_count_id bigint,
	pallet_id bigint,
	expected_location_id bigint,
	expected_quantity decimal(14,2),
	actual_location_id bigint,
	actual_quantity decimal(14,2),
	verification_status_id bigint
);

CREATE TABLE warehouse.verification_status (
	/* VERIFIED, WRONG_LOCATION, WRONG_QUANTITY, MISSING, EXTRA */
	id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	code text
);

CREATE TABLE warehouse.pallet_discrepancy (
	id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	pallet_verification_id bigint,
	resolved boolean,
	resolved_by bigint,
	resolved_at timestamp,
	resolution_notes text
);


/********************************************************************* 
  Procurement: everything about incoming materials
**********************************************************************/

CREATE TABLE procurement.inbound_order_delivery_link (
	id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	inbound_order_id bigint,
	inbound_delivery_id bigint
);

CREATE TABLE procurement.order_status (
	/* ORDERED, PARTLY_DELIVERED, DELIVERED */
	id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	code text

);

CREATE TABLE procurement.inbound_order (
	id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	supplier_id bigint,
	status_id bigint,
	order_reference text,
	expected_delivery_date date
);

CREATE TABLE procurement.inbound_delivery (
	id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	inbound_order_id bigint,
	supplier_id bigint,
	delivery_mode_id bigint,
	truck_license_plate text,
	expected_date date,
	start_unloading_time time,
	end_unloading_time time,
	quantity decimal(14,2),
	unit_id bigint
);

CREATE TABLE procurement.inbound_order_item (
	id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	inbound_order_id bigint,
	material_id bigint,
	expected_quantity decimal(14,2),
	unit_id bigint
);

CREATE TABLE procurement.inbound_delivery_item (
	id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	inbound_delivery_id bigint,
	material_id bigint,
	weight decimal(14,2),
	weight_unit_id bigint,
	volume decimal(14,2),
	volume_unit_id bigint
);

CREATE TABLE procurement.delivery_mode (
	/* TRUCK, SHIP, OTHER */
	id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	code text
);


/********************************************************************* 
  Inventory: stock count and products
**********************************************************************/

CREATE TABLE inventory.stock_item (
	id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	stock_item_type_id bigint NOT NULL,
	name text
);

CREATE TABLE inventory.stock_item_type (
	/* RAW_MATERIAL, INTERNAL_PRODUCT, EXTERNAL_PRODUCT, OTHER */
	id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	code text NOT NULL,
	is_active boolean NOT NULL DEFAULT true
);

CREATE TABLE inventory.stockpile_inventory_snapshot (
	stock_item_id bigint NOT NULL,
	location_id bigint NOT NULL,
	snapshot_at timestamp NOT NULL,
	estimated_amount decimal(14,2),
	unit_id bigint,
	notes text
);