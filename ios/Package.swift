// swift-tools-version: 5.9
import PackageDescription

// Foundation-only business rules can be tested without UIKit or an iOS simulator.
let package = Package(
    name: "HomeworkLedgerCore",
    platforms: [.macOS(.v12), .iOS(.v16)],
    products: [.library(name: "HomeworkLedgerCore", targets: ["HomeworkLedgerCore"])],
    targets: [
        .target(name: "HomeworkLedgerCore", path: "HomeworkLedger/Core"),
        .testTarget(name: "HomeworkLedgerCoreTests", dependencies: ["HomeworkLedgerCore"], path: "Tests")
    ]
)
