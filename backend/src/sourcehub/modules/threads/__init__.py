"""threads — one private conversation per request per delivery partner.

The service is this module's only public surface; the tables are raw SQL
(db/250_rfp_threads.sql) with no ORM model, so nothing here can be imported
by another module's models.
"""
