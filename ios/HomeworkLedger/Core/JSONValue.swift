import Foundation

/// Keep unknown fields when exchanging backups with the web and Android apps.
enum JSONValue: Codable, Equatable {
    case object([String: JSONValue]), array([JSONValue]), string(String)
    case number(Double), bool(Bool), null

    init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()
        if container.decodeNil() { self = .null }
        else if let value = try? container.decode(Bool.self) { self = .bool(value) }
        else if let value = try? container.decode(Double.self) { self = .number(value) }
        else if let value = try? container.decode(String.self) { self = .string(value) }
        else if let value = try? container.decode([String: JSONValue].self) { self = .object(value) }
        else { self = .array(try container.decode([JSONValue].self)) }
    }

    func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        switch self {
        case .object(let value): try container.encode(value)
        case .array(let value): try container.encode(value)
        case .string(let value): try container.encode(value)
        case .number(let value): try container.encode(value)
        case .bool(let value): try container.encode(value)
        case .null: try container.encodeNil()
        }
    }
    var object: JSONObject? { if case .object(let value) = self { return value }; return nil }
    var array: [JSONValue]? { if case .array(let value) = self { return value }; return nil }
    var string: String? { if case .string(let value) = self { return value }; return nil }
    var number: Double? { if case .number(let value) = self { return value }; return nil }
    var bool: Bool? { if case .bool(let value) = self { return value }; return nil }
}

typealias JSONObject = [String: JSONValue]
extension Dictionary where Key == String, Value == JSONValue {
    func text(_ key: String, _ fallback: String = "") -> String { self[key]?.string ?? fallback }
    func number(_ key: String, _ fallback: Double = 0) -> Double { self[key]?.number ?? fallback }
    func flag(_ key: String) -> Bool { self[key]?.bool ?? false }
    func object(_ key: String) -> JSONObject { self[key]?.object ?? [:] }
    func array(_ key: String) -> [JSONValue] { self[key]?.array ?? [] }
    mutating func set(_ key: String, _ value: String) { self[key] = .string(value) }
    mutating func set(_ key: String, _ value: Double) { self[key] = .number(value) }
    mutating func set(_ key: String, _ value: Bool) { self[key] = .bool(value) }
}

struct LedgerError: LocalizedError {
    let message: String
    init(_ message: String) { self.message = message }
    var errorDescription: String? { message }
}

enum Day {
    static var calendar: Calendar { Calendar(identifier: .gregorian) }
    static func key(_ date: Date = Date()) -> String {
        let parts = calendar.dateComponents([.year, .month, .day], from: date)
        return String(format: "%04d-%02d-%02d", parts.year!, parts.month!, parts.day!)
    }
    static func date(_ key: String) -> Date? {
        let values = key.split(separator: "-").compactMap { Int($0) }
        guard values.count == 3, key.count == 10,
              let date = calendar.date(from: DateComponents(year: values[0], month: values[1], day: values[2], hour: 12)),
              self.key(date) == key else { return nil }
        return date
    }
    static func plus(_ key: String, _ days: Int) -> String {
        guard let value = date(key), let result = calendar.date(byAdding: .day, value: days, to: value) else { return key }
        return self.key(result)
    }
    static func range(_ start: String, _ end: String) -> [String] {
        guard date(start) != nil, date(end) != nil, start <= end else { return [] }
        var values: [String] = [], cursor = start
        while cursor <= end && values.count < 366 { values.append(cursor); cursor = plus(cursor, 1) }
        return values
    }
    static func time(_ date: Date = Date()) -> String {
        let p = calendar.dateComponents([.hour, .minute], from: date)
        return String(format: "%02d:%02d", p.hour!, p.minute!)
    }
    static func minutes(_ time: String) -> Int? {
        let p = time.split(separator: ":").compactMap { Int($0) }
        guard p.count == 2, (0...23).contains(p[0]), (0...59).contains(p[1]) else { return nil }
        return p[0] * 60 + p[1]
    }
    static func clock(_ milliseconds: Double) -> String {
        let seconds = Int(min(3_155_760_000, max(0, milliseconds / 1000)))
        return String(format: "%02d:%02d", seconds / 60, seconds % 60)
    }
    static func ms(_ date: Date = Date()) -> Double { date.timeIntervalSince1970 * 1000 }
}

struct HomeworkTask: Identifiable, Equatable {
    var raw: JSONObject
    var id: String { raw.text("id") }
    var title: String { raw.text("title") }
    var subject: String { raw.text("subject", "其他") }
    var status: String { raw.text("status", "pending") }
    var estimatedMinutes: Int {
        let value = raw.number("estimatedMinutes", 15)
        return LedgerState.estimateOptions.first { Double($0) == value } ?? 15
    }
    var untouched: Bool { status == "pending" && raw.text("startedAt").isEmpty && raw.number("elapsedMs") == 0 }
    func elapsed(at now: Date = Date()) -> Double {
        max(0, raw.number("elapsedMs")) + (status == "active" && raw.number("activeSince") > 0
            ? max(0, Day.ms(now) - raw.number("activeSince")) : 0)
    }
}

struct Reward: Equatable {
    let id: String
    let amount: Double
    static func forTime(_ time: String) -> Reward? {
        guard let minutes = Day.minutes(time) else { return nil }
        if minutes <= 1230 { return Reward(id: "best", amount: 1.5) }
        if minutes <= 1240 { return Reward(id: "good", amount: 1) }
        if minutes <= 1290 { return Reward(id: "neutral", amount: 0) }
        return Reward(id: "late", amount: -0.5)
    }
    static func forRecord(_ record: JSONObject) -> Reward? {
        if let value = forTime(record.text("finishTime")) { return value }
        let amounts = ["best": 1.5, "good": 1.0, "neutral": 0.0, "late": -0.5]
        return amounts[record.text("ruleId")].map { Reward(id: record.text("ruleId"), amount: $0) }
    }
}

struct Lesson: Codable, Identifiable {
    let id: String
    let label: String
    let words: [String]
}
