/* 01_schema.sql ******************************************************
  SQL script for creating the database schemas
**********************************************************************/

CREATE SCHEMA claims; /* claims */
CREATE SCHEMA hr; /* human resources */
CREATE SCHEMA inventory; /* stock counts etc. */
CREATE SCHEMA logistics; /* outbound transport planning */
CREATE SCHEMA maintenance; /* maintenance */
CREATE SCHEMA master_data; /* customers, resources, suppliers */
CREATE SCHEMA procurement; /* or inbound orders = buying pallets, raw materials etc. */
CREATE SCHEMA product; /* all products, including materials and recipes */
CREATE SCHEMA production; /* production and packaging */
CREATE SCHEMA quality; /* quality checks and results */
CREATE SCHEMA reference; /* small lookup lists not related to business */
CREATE SCHEMA sales; /* or outbound orders */