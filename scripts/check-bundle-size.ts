/**
 * 主包体积监控脚本
 * 说明：检查主包体积是否超过限制（微信小程序：2MB）
 * 
 * 使用方法：
 *   npx ts-node scripts/check-bundle-size.ts
 */

import * as fs from 'fs'
import * as path from 'path'

// 主包目录（相对于项目根目录）
const MAIN_PACK_DIR = 'pages'
const UNI_MODULES_DIR = 'uni_modules'

// 体积限制（字节）
const MAX_MAIN_PACK_SIZE = 2 * 1024 * 1024 // 2MB
const MAX_TOTAL_SIZE = 8 * 1024 * 1024     // 8MB（微信限制）

/**
 * 获取目录大小（递归计算）
 */
function getDirectorySize(dirPath: string): number {
  let totalSize = 0

  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true })

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name)

      if (entry.isDirectory()) {
        // 递归计算子目录大小
        totalSize += getDirectorySize(fullPath)
      } else if (entry.isFile()) {
        // 累加文件大小
        totalSize += fs.statSync(fullPath).size
      }
    }
  } catch (error) {
    console.warn(`⚠️ 无法读取目录: ${dirPath}`, error)
  }

  return totalSize
}

/**
 * 格式化字节数为可读字符串
 */
function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)}KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)}MB`
}

/**
 * 获取文件扩展名
 */
function getExtension(fileName: string): string {
  const ext = path.extname(fileName)
  return ext ? ext.slice(1) : 'unknown'
}

/**
 * 统计目录中的文件类型分布
 */
function countFileTypes(dirPath: string): Record<string, number> {
  const typeCount: Record<string, number> = {}

  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true })

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name)

      if (entry.isDirectory()) {
        const subCounts = countFileTypes(fullPath)
        for (const [type, count] of Object.entries(subCounts)) {
          typeCount[type] = (typeCount[type] || 0) + count
        }
      } else if (entry.isFile()) {
        const ext = getExtension(entry.name)
        typeCount[ext] = (typeCount[ext] || 0) + 1
      }
    }
  } catch (error) {
    console.warn(`⚠️ 无法读取目录: ${dirPath}`, error)
  }

  return typeCount
}

/**
 * 扫描主包
 */
function scanMainPackage(projectRoot: string): {
  mainPackSize: number
  mainPackFiles: number
  typescriptCount: number
  vueCount: number
  imageCount: number
  otherCount: number
  sizeByType: Record<string, number>
} {
  const mainPackDir = path.join(projectRoot, MAIN_PACK_DIR)
  let mainPackSize = 0
  let mainPackFiles = 0
  let typescriptCount = 0
  let vueCount = 0
  let imageCount = 0
  let otherCount = 0
  const sizeByType: Record<string, number> = {}

  function scanDirectory(dir: string) {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true })

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name)

        if (entry.isDirectory()) {
          scanDirectory(fullPath)
        } else if (entry.isFile()) {
          const stats = fs.statSync(fullPath)
          const ext = getExtension(entry.name).toLowerCase()

          mainPackSize += stats.size
          mainPackFiles++

          // 统计文件类型
          if (ext === 'ts' || ext === 'tsx') {
            typescriptCount++
            sizeByType['typescript'] = (sizeByType['typescript'] || 0) + stats.size
          } else if (ext === 'vue') {
            vueCount++
            sizeByType['vue'] = (sizeByType['vue'] || 0) + stats.size
          } else if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext)) {
            imageCount++
            sizeByType['image'] = (sizeByType['image'] || 0) + stats.size
          } else {
            otherCount++
            sizeByType['other'] = (sizeByType['other'] || 0) + stats.size
          }
        }
      }
    } catch (error) {
      console.warn(`⚠️ 无法读取目录: ${dir}`, error)
    }
  }

  scanDirectory(mainPackDir)

  return {
    mainPackSize,
    mainPackFiles,
    typescriptCount,
    vueCount,
    imageCount,
    otherCount,
    sizeByType,
  }
}

/**
 * 打印体积报告
 */
function printSizeReport(projectRoot: string): void {
  const { mainPackSize, mainPackFiles, typescriptCount, vueCount, imageCount, otherCount, sizeByType } = scanMainPackage(projectRoot)

  console.log('\n========================================')
  console.log('📝 主包体积报告')
  console.log('========================================\n')

  // 基本信息
  console.log(`📦 主包目录: ${MAIN_PACK_DIR}`)
  console.log(`📊 文件总数: ${mainPackFiles.toLocaleString()}`)
  console.log(`📐 主包体积: ${formatSize(mainPackSize)} (${mainPackSize.toLocaleString()} 字节)\n`)

  // 体积限制检查
  console.log('📏 体积限制检查:')
  console.log(`   ✓ 主包限制: ${formatSize(MAX_MAIN_PACK_SIZE)} (2MB)`)
  console.log(`   ✓ 主包当前: ${formatSize(mainPackSize)}`)
  console.log(`   ✓ 状态: ${mainPackSize <= MAX_MAIN_PACK_SIZE ? '✅ 通过' : '❌ 超限'}\n`)

  if (mainPackSize > MAX_MAIN_PACK_SIZE) {
    const overSize = mainPackSize - MAX_MAIN_PACK_SIZE
    console.log(`   ⚠️ 超出限制: ${formatSize(overSize)} (${ ((overSize / MAX_MAIN_PACK_SIZE) * 100).toFixed(1) }%)\n`)
  }

  // 文件类型分布
  console.log('📁 文件类型分布:')
  console.log(`   TypeScript: ${typescriptCount.toLocaleString()} 个`)
  console.log(`   Vue: ${vueCount.toLocaleString()} 个`)
  console.log(`   图片: ${imageCount.toLocaleString()} 个`)
  console.log(`   其他: ${otherCount.toLocaleString()} 个\n`)

  // 体积占比
  console.log('📊 体积占比:')
  const totalSize = mainPackSize
  for (const [type, size] of Object.entries(sizeByType)) {
    const percentage = ((size / totalSize) * 100).toFixed(1)
    console.log(`   ${type.padEnd(12)}: ${formatSize(size).padStart(10)} (${percentage}%)`)
  }

  // 优化建议
  console.log('\n💡 优化建议:')
  if (sizeByType['image'] && (sizeByType['image'] / totalSize) > 0.5) {
    console.log('   ⚠️  图片体积占比高，建议压缩图片或使用 WebP 格式')
  }
  if (typescriptCount > 50) {
    console.log('   ✅ TypeScript 代码较多，建议启用代码分割')
  }
  if (vueCount > 20) {
    console.log('   ✅ Vue 组件较多，建议启用 easycom 组件自动导入')
  }

  // 未使用的 uView 组件检查（简化版）
  console.log('\n🔍 未使用组件检查:')
  const uniModulesDir = path.join(projectRoot, UNI_MODULES_DIR)
  try {
    if (fs.existsSync(uniModulesDir)) {
      const modules = fs.readdirSync(uniModulesDir)
      console.log(`   ℹ️  已安装的 uni_modules: ${modules.slice(0, 5).join(', ')}${modules.length > 5 ? '...' : ''}`)
    }
  } catch {
    // 忽略错误
  }

  console.log('\n========================================\n')
}

/**
 * 主函数
 */
function main() {
  // 获取项目根目录
  const projectRoot = process.cwd()

  console.log(`🔍 检查项目: ${projectRoot}`)
  console.log('========================================\n')

  // 打印报告
  printSizeReport(projectRoot)
}

// 执行
main()
