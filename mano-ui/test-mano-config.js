#!/usr/bin/env node

/**
 * 测试脚本：验证 mano-config 功能
 */

// 测试 nameToFilename 函数
function nameToFilename(name) {
  return name
    .trim()                          // Trim whitespace first
    .replace(/[/\\:*?"<>|]/g, '_')  // Replace invalid chars with underscore
    .replace(/\s+/g, '_')            // Replace all whitespace with single underscore
    .replace(/_+/g, '_')             // Collapse multiple underscores
    .replace(/^_+|_+$/g, '')         // Remove leading/trailing underscores
}

// 测试用例
const testCases = [
  {
    input: '第一回 灵根育孕源流出 心性修持大道生',
    expected: '第一回_灵根育孕源流出_心性修持大道生'
  },
  {
    input: 'File: Test/Test',
    expected: 'File_Test_Test'  // Collapses multiple underscores
  },
  {
    input: 'Test:File*Name?',
    expected: 'Test_File_Name'  // Removes trailing underscore
  },
  {
    input: '  Multiple   Spaces  ',
    expected: 'Multiple_Spaces'
  }
]

console.log('测试 nameToFilename 函数:')
console.log('='.repeat(50))

let passed = 0
let failed = 0

testCases.forEach((test, index) => {
  const result = nameToFilename(test.input)
  const isPass = result === test.expected
  
  if (isPass) {
    passed++
    console.log(`✓ 测试 ${index + 1}: 通过`)
  } else {
    failed++
    console.log(`✗ 测试 ${index + 1}: 失败`)
    console.log(`  输入: "${test.input}"`)
    console.log(`  期望: "${test.expected}"`)
    console.log(`  实际: "${result}"`)
  }
})

console.log('='.repeat(50))
console.log(`总计: ${testCases.length} 个测试`)
console.log(`通过: ${passed}`)
console.log(`失败: ${failed}`)

if (failed === 0) {
  console.log('\n✓ 所有测试通过！')
  process.exit(0)
} else {
  console.log('\n✗ 部分测试失败')
  process.exit(1)
}
