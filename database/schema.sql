Restarting 'server.js'
✅ All routes loaded successfully
✅ Database connection established successfully.
✅ Database synchronized successfully
🚀 Barber Shop Management System running on port 3000
📍 Visit: http://localhost:3000
🔧 Environment: development
🔐 === LOGIN ATTEMPT START ===
📧 Email/Username: michael.brown@email.com
🔑 Password length: 11
👨‍💼 === CHECKING ADMIN ===
📊 Admin search result: NOT FOUND
👤 === CHECKING CUSTOMER ===
📊 Customer search result: FOUND
🔍 Customer details: {
  id: 1,
  email: 'michael.brown@email.com',
  name: 'Michael Brown',
  is_active: true,
  hasCheckPassword: 'function'
}
✅ Customer password check: true
🎉 CUSTOMER LOGIN SUCCESSFUL!
🔄 Redirecting to /customer/dashboard
(node:17964) [DEP0044] DeprecationWarning: The `util.isArray` API is deprecated. Please use `Array.isArray()` instead.
(Use `node --trace-deprecation ...` to show where the warning was created)
Customer dashboard error: Error
    at Query.run (C:\Users\SENIOR\Documents\mato\barber-shop-management\node_modules\sequelize\lib\dialects\mysql\query.js:52:25)
    at C:\Users\SENIOR\Documents\mato\barber-shop-management\node_modules\sequelize\lib\sequelize.js:315:28
    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
    at async MySQLQueryInterface.select (C:\Users\SENIOR\Documents\mato\barber-shop-management\node_modules\sequelize\lib\dialects\abstract\query-interface.js:407:12)
    at async Appointment.findAll (C:\Users\SENIOR\Documents\mato\barber-shop-management\node_modules\sequelize\lib\model.js:1140:21)
    at async showDashboard (C:\Users\SENIOR\Documents\mato\barber-shop-management\controllers\customerController.js:26:42) {
  name: 'SequelizeDatabaseError',
  parent: Error: Unknown column 'barber.specialization' in 'field list'
      at Packet.asError (C:\Users\SENIOR\Documents\mato\barber-shop-management\node_modules\mysql2\lib\packets\packet.js:740:17)
      at Query.execute (C:\Users\SENIOR\Documents\mato\barber-shop-management\node_modules\mysql2\lib\commands\command.js:29:26)
      at Connection.handlePacket (C:\Users\SENIOR\Documents\mato\barber-shop-management\node_modules\mysql2\lib\base\connection.js:477:34)
      at PacketParser.onPacket (C:\Users\SENIOR\Documents\mato\barber-shop-management\node_modules\mysql2\lib\base\connection.js:93:12)
      at PacketParser.executeStart (C:\Users\SENIOR\Documents\mato\barber-shop-management\node_modules\mysql2\lib\packet_parser.js:75:16)
      at Socket.<anonymous> (C:\Users\SENIOR\Documents\mato\barber-shop-management\node_modules\mysql2\lib\base\connection.js:100:25)
      at Socket.emit (node:events:508:28)
      at addChunk (node:internal/streams/readable:559:12)
      at readableAddChunkPushByteMode (node:internal/streams/readable:510:3)
      at Readable.push (node:internal/streams/readable:390:5) {
    code: 'ER_BAD_FIELD_ERROR',
    errno: 1054,
    sqlState: '42S22',
    sqlMessage: "Unknown column 'barber.specialization' in 'field list'",
    sql: "SELECT `Appointment`.`id`, `Appointment`.`customer_id`, `Appointment`.`service_id`, `Appointment`.`barber_id`, `Appointment`.`appointment_date`, `Appointment`.`status`, `Appointment`.`notes`, `Appointment`.`total_price`, `Appointment`.`appointment_end`, `Appointment`.`cancellation_reason`, `Appointment`.`created_at` AS `createdAt`, `Appointment`.`updated_at` AS `updatedAt`, `service`.`id` AS `service.id`, `service`.`name` AS `service.name`, `service`.`price` AS `service.price`, `service`.`duration` AS `service.duration`, `service`.`description` AS `service.description`, `barber`.`id` AS `barber.id`, `barber`.`name` AS `barber.name`, `barber`.`specialization` AS `barber.specialization`, `barber`.`experience` AS `barber.experience` FROM `appointments` AS `Appointment` LEFT OUTER JOIN `services` AS `service` ON `Appointment`.`service_id` = `service`.`id` LEFT OUTER JOIN `barbers` AS `barber` ON `Appointment`.`barber_id` = `barber`.`id` WHERE `Appointment`.`customer_id` = 1 AND `Appointment`.`appointment_date` >= '2025-11-27 11:15:17' AND `Appointment`.`status` IN ('pending', 'confirmed') ORDER BY `Appointment`.`appointment_date` ASC LIMIT 5;",
    parameters: undefined
  },
  original: Error: Unknown column 'barber.specialization' in 'field list'
      at Packet.asError (C:\Users\SENIOR\Documents\mato\barber-shop-management\node_modules\mysql2\lib\packets\packet.js:740:17)
      at Query.execute (C:\Users\SENIOR\Documents\mato\barber-shop-management\node_modules\mysql2\lib\commands\command.js:29:26)
      at Connection.handlePacket (C:\Users\SENIOR\Documents\mato\barber-shop-management\node_modules\mysql2\lib\base\connection.js:477:34)
      at PacketParser.onPacket (C:\Users\SENIOR\Documents\mato\barber-shop-management\node_modules\mysql2\lib\base\connection.js:93:12)
      at PacketParser.executeStart (C:\Users\SENIOR\Documents\mato\barber-shop-management\node_modules\mysql2\lib\packet_parser.js:75:16)
      at Socket.<anonymous> (C:\Users\SENIOR\Documents\mato\barber-shop-management\node_modules\mysql2\lib\base\connection.js:100:25)
      at Socket.emit (node:events:508:28)
      at addChunk (node:internal/streams/readable:559:12)
      at readableAddChunkPushByteMode (node:internal/streams/readable:510:3)
      at Readable.push (node:internal/streams/readable:390:5) {
    code: 'ER_BAD_FIELD_ERROR',
    errno: 1054,
    sqlState: '42S22',
    sqlMessage: "Unknown column 'barber.specialization' in 'field list'",
    sql: "SELECT `Appointment`.`id`, `Appointment`.`customer_id`, `Appointment`.`service_id`, `Appointment`.`barber_id`, `Appointment`.`appointment_date`, `Appointment`.`status`, `Appointment`.`notes`, `Appointment`.`total_price`, `Appointment`.`appointment_end`, `Appointment`.`cancellation_reason`, `Appointment`.`created_at` AS `createdAt`, `Appointment`.`updated_at` AS `updatedAt`, `service`.`id` AS `service.id`, `service`.`name` AS `service.name`, `service`.`price` AS `service.price`, `service`.`duration` AS `service.duration`, `service`.`description` AS `service.description`, `barber`.`id` AS `barber.id`, `barber`.`name` AS `barber.name`, `barber`.`specialization` AS `barber.specialization`, `barber`.`experience` AS `barber.experience` FROM `appointments` AS `Appointment` LEFT OUTER JOIN `services` AS `service` ON `Appointment`.`service_id` = `service`.`id` LEFT OUTER JOIN `barbers` AS `barber` ON `Appointment`.`barber_id` = `barber`.`id` WHERE `Appointment`.`customer_id` = 1 AND `Appointment`.`appointment_date` >= '2025-11-27 11:15:17' AND `Appointment`.`status` IN ('pending', 'confirmed') ORDER BY `Appointment`.`appointment_date` ASC LIMIT 5;",
    parameters: undefined
  },
  sql: "SELECT `Appointment`.`id`, `Appointment`.`customer_id`, `Appointment`.`service_id`, `Appointment`.`barber_id`, `Appointment`.`appointment_date`, `Appointment`.`status`, `Appointment`.`notes`, `Appointment`.`total_price`, `Appointment`.`appointment_end`, `Appointment`.`cancellation_reason`, `Appointment`.`created_at` AS `createdAt`, `Appointment`.`updated_at` AS `updatedAt`, `service`.`id` AS `service.id`, `service`.`name` AS `service.name`, `service`.`price` AS `service.price`, `service`.`duration` AS `service.duration`, `service`.`description` AS `service.description`, `barber`.`id` AS `barber.id`, `barber`.`name` AS `barber.name`, `barber`.`specialization` AS `barber.specialization`, `barber`.`experience` AS `barber.experience` FROM `appointments` AS `Appointment` LEFT OUTER JOIN `services` AS `service` ON `Appointment`.`service_id` = `service`.`id` LEFT OUTER JOIN `barbers` AS `barber` ON `Appointment`.`barber_id` = `barber`.`id` WHERE `Appointment`.`customer_id` = 1 AND `Appointment`.`appointment_date` >= '2025-11-27 11:15:17' AND `Appointment`.`status` IN ('pending', 'confirmed') ORDER BY `Appointment`.`appointment_date` ASC LIMIT 5;",
  parameters: {}
}
