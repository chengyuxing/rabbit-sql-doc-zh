import {Component} from '@angular/core';
import {
  MatCell, MatCellDef,
  MatColumnDef, MatHeaderCell,
  MatHeaderCellDef,
  MatHeaderRow,
  MatHeaderRowDef,
  MatRow,
  MatRowDef,
  MatTable
} from '@angular/material/table';
import hljs from 'highlight.js';
import {SafehtmlPipe} from '../../../pipes/safehtml.pipe';
import {MatDivider} from '@angular/material/divider';
import {RouterLink} from '@angular/router';

@Component({
  selector: 'rabbit-sql-about',
  imports: [
    MatTable,
    MatHeaderRow,
    MatHeaderRowDef,
    MatRow,
    MatRowDef,
    MatColumnDef,
    MatHeaderCellDef,
    MatHeaderCell,
    MatCell,
    MatCellDef,
    SafehtmlPipe,
    MatDivider,
    RouterLink
  ],
  templateUrl: './about.component.html',
  styleUrl: './about.component.scss'
})
export class AboutComponent {
  datasource: any[] = [
    {feature: '国产化', rabbit: '✅ 完全自主可控，满足信创', mybatis: '❌', jpa: '❌'},
    {feature: '快速上手成本', rabbit: '✅ 极低', mybatis: '⚠️ 高', jpa: '⚠️ 高'},
    {feature: '动态 SQL', rabbit: '✅ 高性能、极简、直观、易于测试', mybatis: '⚠️ 但繁琐', jpa: '⚠️ 复杂'},
    {feature: 'SQL 文件独立管理', rabbit: '✅ 自创XQL格式，完全支持', mybatis: '⚠️ 但繁琐', jpa: '❌ 不支持'},
    {feature: 'Spring Boot', rabbit: '✅ 支持', mybatis: '✅ 支持', jpa: '✅ 原生'},
    {feature: '实体映射', rabbit: '⚠️ 基本支持', mybatis: '⚠️ 稍繁琐', jpa: '✅ 完备'},
    {feature: '存储过程/函数', rabbit: '✅ 简单', mybatis: '⚠️ 稍繁琐', jpa: '⚠️ 繁琐'},
    {feature: '分页查询', rabbit: '✅ 内置支持、扩展轻松', mybatis: '⚠️ 限于第三方', jpa: '✅ 支持'},
    {feature: '插件', rabbit: '✅ 专属 IDEA 插件', mybatis: '⚠️ 限于 XML', jpa: '❌'},
    {feature: '适合复杂查询', rabbit: '✅ 非常适合', mybatis: '⚠️ 但繁琐', jpa: '❌ 不适合'},
    {feature: '性能可控', rabbit: '✅ 手写 SQL', mybatis: '✅ 手写 SQL', jpa: '⚠️ 框架生成'},
  ];
  displayedColumns: string[] = ['feature', 'rabbit', 'mybatis', 'jpa'];

  code = `select * from test.user t
where
-- #if :id > 100
  t.id <= 99
-- #else
  t.id > :id
-- #fi`;

  get highlightCode() {
    return hljs.highlight(this.code, {language: 'sql'}).value;
  }
}
