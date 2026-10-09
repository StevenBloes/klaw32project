/* 01_schema.sql ******************************************************
  SQL script for creating the database schemas
**********************************************************************/

CREATE SCHEMA claim; /* claims */
CREATE SCHEMA facility; /* contains the facility locations */
CREATE SCHEMA hr; /* human resources */
CREATE SCHEMA inventory; /* stock counts etc. */
CREATE SCHEMA logistics; /* outbound transport planning */
CREATE SCHEMA maintenance; /* maintenance */
CREATE SCHEMA master_data; /* customers, resources, suppliers */
CREATE SCHEMA operations; /* resources, machine components etc. */
CREATE SCHEMA procurement; /* or inbound orders = buying pallets, raw materials etc. */
CREATE SCHEMA product; /* all products, including materials and recipes */
CREATE SCHEMA production; /* production and packaging */
CREATE SCHEMA quality; /* quality checks and results */
CREATE SCHEMA reference; /* small lookup lists not related to business */
CREATE SCHEMA sales; /* or outbound orders */
CREATE SCHEMA warehouse; /* tracking of materials inside the facilities */